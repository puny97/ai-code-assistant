import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { GeneratedFile, ValidationResult } from "../agent/state.js";

const SANDBOX_IMAGE =
  process.env.SANDBOX_DOCKER_IMAGE ?? "ai-code-assistant-sandbox:1";

const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_FILES = 30;
const MAX_FILE_SIZE = 100 * 1024;
const MAX_TOTAL_SIZE = 1024 * 1024;

interface DockerExecutionResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  outputExceeded: boolean;
  executionError?: string;
}

function validateFiles(files: GeneratedFile[]): void {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No generated files were provided.");
  }

  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} generated files are allowed.`);
  }

  let totalSize = 0;
  const seenPaths = new Set<string>();

  for (const file of files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      typeof file.content !== "string"
    ) {
      throw new Error(
        "Every generated file must have a path and string content.",
      );
    }

    const normalizedPath = file.path.replace(/\\/g, "/");

    if (
      !normalizedPath ||
      normalizedPath.startsWith("/") ||
      /^[a-zA-Z]:/.test(normalizedPath)
    ) {
      throw new Error(`Invalid file path: ${file.path}`);
    }

    const segments = normalizedPath.split("/");

    if (
      segments.some(
        (segment) =>
          !segment ||
          segment === "." ||
          segment === ".." ||
          segment.toLowerCase() === "node_modules" ||
          segment.toLowerCase() === ".git",
      )
    ) {
      throw new Error(`Unsafe file path: ${file.path}`);
    }

    const filename = segments.at(-1)!.toLowerCase();

    // Generated files must not override the sandbox's configuration.
    const reservedFiles = [
      "package.json",
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "tsconfig.json",
    ];

    if (reservedFiles.includes(filename) || filename.startsWith(".env")) {
      throw new Error(`Reserved file is not allowed: ${file.path}`);
    }

    const key = normalizedPath.toLowerCase();

    if (seenPaths.has(key)) {
      throw new Error(`Duplicate generated file path: ${file.path}`);
    }

    seenPaths.add(key);

    const fileSize = Buffer.byteLength(file.content, "utf8");

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File exceeds the size limit: ${file.path}`);
    }

    totalSize += fileSize;

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error("Total generated file size exceeds 1 MB.");
    }
  }
}

async function createWorkspace(files: GeneratedFile[]): Promise<string> {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "ai-code-sandbox-"));

  try {
    for (const file of files) {
      const normalizedPath = file.path.replace(/\\/g, "/");
      const filePath = path.resolve(workspace, ...normalizedPath.split("/"));

      const relativePath = path.relative(workspace, filePath);

      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error(`File path escapes workspace: ${file.path}`);
      }

      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, file.content, {
        encoding: "utf8",
        flag: "wx",
      });
    }

    return workspace;
  } catch (error) {
    await rm(workspace, { recursive: true, force: true });
    throw error;
  }
}

function removeContainer(containerName: string): void {
  // This is a fixed Docker command. No generated code is passed to it.
  const cleanup = spawn("docker", ["rm", "--force", containerName], {
    stdio: "ignore",
    windowsHide: true,
  });

  cleanup.on("error", () => {
    // The container may already have exited or been removed.
  });
}

function executeInDocker(workspace: string): Promise<DockerExecutionResult> {
  return new Promise((resolve) => {
    const containerName = `code-sandbox-${randomUUID()}`;

    const args = [
      "run",
      "--rm",
      "--name",
      containerName,

      // Network isolation.
      "--network",
      "none",

      // Resource limits.
      "--memory",
      "256m",
      "--memory-swap",
      "256m",
      "--cpus",
      "0.5",
      "--pids-limit",
      "64",

      // Container hardening.
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--user",
      "10001:10001",

      // Writable temporary directory only.
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=64m",

      // Generated source is read-only inside the container.
      "--mount",
      `type=bind,source=${workspace},target=/workspace/project,readonly`,

      SANDBOX_IMAGE,

      // Only the fixed compiler command is executed.
      "./node_modules/.bin/tsc",
      "--noEmit",
      "--pretty",
      "false",
      "--project",
      "/workspace/tsconfig.json",
    ];

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputExceeded = false;
    let settled = false;

    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    const finish = (result: DockerExecutionResult) => {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      resolve(result);
    };

    const stopContainer = () => {
      removeContainer(containerName);
      child.kill("SIGTERM");
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      stopContainer();
    }, TIMEOUT_MS);

    const collectOutput = (chunk: Buffer, target: "stdout" | "stderr") => {
      outputBytes += chunk.length;

      if (outputBytes > MAX_OUTPUT_BYTES) {
        outputExceeded = true;
        stopContainer();
        return;
      }

      if (target === "stdout") {
        stdout += chunk.toString("utf8");
      } else {
        stderr += chunk.toString("utf8");
      }
    };

    child.stdout.on("data", (chunk: Buffer) => {
      collectOutput(chunk, "stdout");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      collectOutput(chunk, "stderr");
    });

    child.on("error", (error: Error) => {
      finish({
        exitCode: null,
        stdout,
        stderr,
        timedOut,
        outputExceeded,
        executionError: error.message,
      });
    });

    child.on("close", (code) => {
      finish({
        exitCode: code,
        stdout,
        stderr,
        timedOut,
        outputExceeded,
      });
    });
  });
}

export async function validateGeneratedCode(
  files: GeneratedFile[],
): Promise<ValidationResult> {
  let workspace: string | undefined;

  try {
    validateFiles(files);

    workspace = await createWorkspace(files);

    const result = await executeInDocker(workspace);

    if (result.executionError) {
      return {
        passed: false,
        errors: [`Sandbox execution failed: ${result.executionError}`],
        warnings: [],
      };
    }

    if (result.timedOut) {
      return {
        passed: false,
        errors: [`Validation timed out after ${TIMEOUT_MS / 1000} seconds.`],
        warnings: [],
      };
    }

    if (result.outputExceeded) {
      return {
        passed: false,
        errors: ["Sandbox output exceeded the 64 KB limit."],
        warnings: [],
      };
    }

    const output = `${result.stdout}\n${result.stderr}`.trim();

    if (result.exitCode !== 0) {
      return {
        passed: false,
        errors: output
          ? output.split(/\r?\n/).filter(Boolean)
          : ["TypeScript compilation failed."],
        warnings: [],
      };
    }

    return {
      passed: true,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    return {
      passed: false,
      errors: [
        error instanceof Error
          ? error.message
          : "An unknown sandbox error occurred.",
      ],
      warnings: [],
    };
  } finally {
    if (workspace) {
      await rm(workspace, {
        recursive: true,
        force: true,
      });
    }
  }
}

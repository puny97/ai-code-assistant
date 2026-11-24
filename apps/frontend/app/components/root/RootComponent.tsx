"use client";

import { useState } from "react";
import { generateCode, type GenerateCodeResponse } from "@/lib/api";

export default function RootComponent() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [framework, setFramework] = useState("express");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState<GenerateCodeResponse | null>(null);

  async function handleGenerate() {
    if (prompt.trim().length < 10) {
      setError("Please enter a requirement with at least 10 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await generateCode({
        prompt,
        language,
        framework,
      });

      setResult(response);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">AI Code Assistant</h1>

          <p className="mt-2 text-gray-400">
            Describe your requirement. Let the AI plan, generate, and review
            your code.
          </p>
        </header>

        <section className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Your requirement
            </label>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: Create a REST API for managing books with CRUD operations..."
              rows={6}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 p-4 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Language</label>

              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Framework
              </label>

              <select
                value={framework}
                onChange={(event) => setFramework(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3"
              >
                <option value="express">Express</option>
                <option value="nestjs">NestJS</option>
                <option value="nextjs">Next.js</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Code"}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        {result && <ResultSection result={result} />}
      </div>
    </main>
  );
}

function ResultSection({ result }: { result: GenerateCodeResponse }) {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold">Agent result</h2>

        <p className="mt-2 text-gray-300">{result.response}</p>

        <p className="mt-3 text-sm">
          Status:{" "}
          <span
            className={
              result.status === "completed" ? "text-green-400" : "text-red-400"
            }
          >
            {result.status}
          </span>
        </p>
      </div>

      {result.plan && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-xl font-semibold">Implementation plan</h2>

          <p className="mt-3 text-gray-300">{result.plan.summary}</p>

          <h3 className="mt-4 font-medium">Tasks</h3>

          <ul className="mt-2 list-inside list-disc space-y-1 text-gray-400">
            {result.plan.tasks.map((task, index) => (
              <li key={index}>{task}</li>
            ))}
          </ul>

          <h3 className="mt-4 font-medium">Files to create</h3>

          <ul className="mt-2 list-inside list-disc space-y-1 text-gray-400">
            {result.plan.filesToCreate.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {result.review && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-xl font-semibold">Code review</h2>

          <p className="mt-3">
            {result.review.approved ? "Approved" : "Rejected"}
          </p>

          {result.review.issues.map((issue, index) => (
            <p key={index} className="mt-2 text-red-400">
              - {issue}
            </p>
          ))}

          {result.review.suggestions.map((suggestion, index) => (
            <p key={index} className="mt-2 text-gray-400">
              - {suggestion}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Generated files ({result.files.length} ?? 0)
        </h2>

        {result.files.map((file) => (
          <div
            key={file.path}
            className="overflow-hidden rounded-xl border border-gray-800"
          >
            <div className="border-b border-gray-800 bg-gray-900 px-4 py-3 font-mono text-sm">
              {file.path}
            </div>

            <pre className="overflow-x-auto bg-gray-950 p-4 text-sm text-gray-300">
              <code>{file.content}</code>
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}

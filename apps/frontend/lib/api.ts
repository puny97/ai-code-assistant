const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type GeneratedFile = {
  path: string;
  content: string;
};

export type GenerateCodeResponse = {
  status: "completed" | "failed";
  plan: {
    summary: string;
    tasks: string[];
    filesToCreate: string[];
    technicalDecisions: string[];
  } | null;
  files: GeneratedFile[];
  review: {
    approved: boolean;
    issues: string[];
    suggestions: string[];
  } | null;
  response: string;
};

type GenerateCodeInput = {
  prompt: string;
  language: string;
  framework: string;
};

export async function generateCode(
  input: GenerateCodeInput,
): Promise<GenerateCodeResponse> {
  const response = await fetch(`${API_URL}/api/v1/code/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new error(error.message ?? "Code generation failed");
  }
  return response.json();
}

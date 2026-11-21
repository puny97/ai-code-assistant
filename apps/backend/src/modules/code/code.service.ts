import { randomUUID } from "crypto";
import { codeAgent } from "../../agent/workflow.js";

interface GenerateCodeInput {
  prompt: string;
  language: string;
  framework: string;
  threadId?: string;
}

export const codeService = {
  async generate(input: GenerateCodeInput) {
    const threadId = input.threadId ?? randomUUID();

    const result = await codeAgent.invoke(
      {
        userRequest: input.prompt,
        framework: input.framework,
        language: input.language,
        iteration: 0,
        maxIterations: 3,
      },
      {
        configurable: {
          thread_id: threadId,
        },
        recursionLimit: 20,
      },
    );

    return {
      threadId,
      status: result.status,
      plan: result.plan,
      review: result.review,
      files: result.generatedFiles,
      validation: result.validation,
      response: result.finalResponse,
    };
  },
};

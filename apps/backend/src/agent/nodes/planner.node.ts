import { z } from "zod";
import { model } from "../model.js";
import type { CodeAgentStateType } from "../state.js";

const PlanSchema = z.object({
  summary: z.string(),
  tasks: z.array(z.string()),
  filesToCreate: z.array(z.string()),
  technicalDecisions: z.array(z.string()),
});

const plannerModel = model.withStructuredOutput(PlanSchema, {
  method: "functionCalling",
  name: "create_implementation_plan",
});

export async function plannerNode(state: CodeAgentStateType) {
  const plan = await plannerModel.invoke([
    {
      role: "system",
      content: `
      You are a senior software architect.

      Analyze the user's coding requirement.

      Create a practical implement plan.

      Rules:
      - Break the requirement into small tasks.
      - Identify all necessary files.
      - Follow the requested language and framework.
      - Prefer simple and maintainable architecture.
      - Include validation and error handling.
      - Do not generate source code.
      `,
    },

    {
      role: "human",
      content: `
        Requirement: ${state.userRequest}

        Language: ${state.language}

        Framework: ${state.framework}
        `,
    },
  ]);

  return {
    plan,
    status: "generating" as const,
  };
}

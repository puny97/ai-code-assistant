import { z } from "zod";
import { model } from "../model.js";
import { CodeAgentStateType } from "../state.js";

const generatedFileSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    }),
  ),
});

const generatorModel = model.withStructuredOutput(generatedFileSchema, {
  method: "functionCalling",
  name: "generate_source_files",
});

export async function generatorNode(state: CodeAgentStateType) {
  const generated = await generatorModel.invoke([
    {
      role: "system",
      content: `
            You are a senior full stack software engineer.

            Generate complete, working source files.

            Rules:
            - Follow the implementation plan.
            - Write actual source code, not explanations.
            - Include export, import lines.
            - Follow Typescript best practices.
            - Include proper validation.
            - Handle errors appropriately.
            - Do not use placeholders.
            - Do not modify the files outside the requested project scope.

            Return each file with its relative path and complete content
            `,
    },
    {
      role: "human",
      content: JSON.stringify({
        requirement: state.userRequest,
        plan: state.plan,
        language: state.language,
        framework: state.framework,
      }),
    },
  ]);

  return {
    generatedFiles: generated.files,
    review: null,
    validation: null,
    status: "reviewing" as const,
  };
}

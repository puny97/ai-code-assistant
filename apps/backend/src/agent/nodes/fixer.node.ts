import z from "zod";
import { model } from "../model.js";
import { CodeAgentStateType } from "../state.js";

const FixSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    }),
  ),
});

const fixModel = model.withStructuredOutput(FixSchema);

export async function fixerNode(state: CodeAgentStateType) {
  const fixed = await fixModel.invoke([
    {
      role: "system",
      content: `
            You are an expert debugging engineer.

            Fix the problems in the generated source code.

            Rules:
            - Preserve existing working functionality.
            - Fix all blocking review issues.
            - Fix validation errors.
            - Return the complete updated file set.
            - Do not introduce unrelated changes.
            `,
    },
    {
      role: "human",
      content: JSON.stringify({
        originalRequirement: state.userRequest,
        currentFiles: state.generatedFiles,
        review: state.review,
        validation: state.validation,
      }),
    },
  ]);

  return {
    generatedFiles: fixed.files,
    iteration: state.iteration + 1,
    review: null,
    validation: null,
    status: "reviewing" as const,
  };
}

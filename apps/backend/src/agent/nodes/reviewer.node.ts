import z from "zod";
import { model } from "../model.js";
import { CodeAgentStateType } from "../state.js";

const ReviewSchema = z.object({
  approved: z.boolean(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

const reviewModel = model.withStructuredOutput(ReviewSchema);

export async function reviewerNode(state: CodeAgentStateType) {
  const review = await reviewModel.invoke([
    {
      role: "system",
      content: `
            Ypu are a strict senior code reviewer.

            Review the generated source code.

            Check:
            1. Does it satisfy the original requirement?
            2. Are there logical errors?
            3. Is input validation implemented?
            4. Is error handling correct?
            5. Are there security problems?
            6. Are imports and dependencies consistent?

            Approve only when there are no blocking issues.

            Distinguish blocking issues from optional suggestions.
            `,
    },
    {
      role: "human",
      content: JSON.stringify({
        requirement: state.userRequest,
        plan: state.plan,
        files: state.generatedFiles,
      }),
    },
  ]);

  return {
    review,
    status: review.approved ? ("validating" as const) : ("generating" as const),
  };
}

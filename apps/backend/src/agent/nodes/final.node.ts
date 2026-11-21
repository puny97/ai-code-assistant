import { CodeAgentStateType } from "../state.js";

export async function finalNode(state: CodeAgentStateType) {
  const success =
    state.review?.approved === true && state.validation?.passed === true;

  return {
    status: success ? ("completed" as const) : ("failed" as const),
    finalResponse: success
      ? `Successfully generated ${state.generatedFiles.length} files. Code review and validation passed`
      : `Code generation could not be completed successfully. Review attempts ${state.iteration}. Check the iteration and validation results.`,
  };
}

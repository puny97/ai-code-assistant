import { validateGeneratedCode } from "../../sandbox/sandbox.service.js";
import { CodeAgentStateType } from "../state.js";

export async function validatorNode(state: CodeAgentStateType) {
  const validation = await validateGeneratedCode(state.generatedFiles);

  return {
    validation,
    status: validation.passed
      ? ("completed" as const)
      : ("generating" as const),
  };
}

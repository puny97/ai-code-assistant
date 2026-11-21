import { END, START, StateGraph } from "@langchain/langgraph";
import { CodeAgentState } from "./state.js";
import { plannerNode } from "./nodes/planner.node.js";
import { generatorNode } from "./nodes/generator.node.js";
import { reviewerNode } from "./nodes/reviewer.node.js";
import { validatorNode } from "./nodes/validator.node.js";
import { fixerNode } from "./nodes/fixer.node.js";
import { finalNode } from "./nodes/final.node.js";

function routeAfterReview(state: typeof CodeAgentState.State) {
  if (state.review?.approved) {
    return "validator";
  }

  if (state.iteration < state.maxIterations) {
    return "fixer";
  }

  return "final";
}

function routeAfterValidation(state: typeof CodeAgentState.State) {
  if (state.validation?.passed) {
    return "final";
  }

  if (state.iteration < state.maxIterations) {
    return "fixer";
  }

  return "final";
}

const workflow = new StateGraph(CodeAgentState)

  //Register nodes
  .addNode("planner", plannerNode)
  .addNode("generator", generatorNode)
  .addNode("reviewer", reviewerNode)
  .addNode("validator", validatorNode)
  .addNode("fixer", fixerNode)
  .addNode("final", finalNode)

  //Initial flow
  .addEdge(START, "planner")
  .addEdge("planner", "generator")
  .addEdge("generator", "reviewer")

  //Review Routing
  .addConditionalEdges("reviewer", routeAfterReview, {
    validator: "validator",
    fixer: "fixer",
    final: "final",
  })

  //validation routing
  .addConditionalEdges("validator", routeAfterValidation, {
    fixer: "fixer",
    final: "final",
  })

  //fix loop
  .addEdge("fixer", "reviewer")

  //finish
  .addEdge("final", END);

export const codeAgent = workflow.compile();

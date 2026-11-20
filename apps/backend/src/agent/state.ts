import { Annotation } from "@langchain/langgraph";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface Plan {
  summary: string;
  tasks: string[];
  filesToCreate: string[];
  technicalDecisions: string[];
}

export interface Review {
  approved: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export const CodeAgentState = Annotation.Root({
  userRequest: Annotation<string>(),
  language: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "typescript",
  }),
  framework: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "express",
  }),
  plan: Annotation<Plan | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  generatedFiles: Annotation<GeneratedFile[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  review: Annotation<Review | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  validation: Annotation<ValidationResult | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  iteration: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 3,
  }),
  status: Annotation<
    | "planning"
    | "generating"
    | "reviewing"
    | "validating"
    | "completed"
    | "failed"
  >({
    reducer: (_prev, next) => next,
    default: () => "planning",
  }),
  finalResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

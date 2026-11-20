import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "../config/env.js";

export const model = new ChatOpenRouter({
  model: env.OPENROUTER_MODEL,
  temperature: 0,
  maxRetries: 2,
});

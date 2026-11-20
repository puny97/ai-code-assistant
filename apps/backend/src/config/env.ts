import dotenv from "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(8000),

  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),

  OPENROUTER_MODEL: z.string().default("deepseek/deepseek-v4.1-flash"),

  FRONTEND_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);

import { z } from "zod";

export const generateCodeSchema = z.object({
  prompt: z.string().trim().min(10).max(10000),
  language: z.string().default("typescript"),
  framework: z.string().default("express"),
  threadId: z.uuid().optional(),
});

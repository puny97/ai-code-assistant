import express from "express";
import helmet from "helmet";
import cors from "cors";

import codeRoutes from "./modules/code/code.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  return res.json({
    success: true,
    message: "AI code assistan API is running",
  });
});

app.use("/api/v1/code", codeRoutes);

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const isDevelopment = process.env.NODE_ENV !== "production";

    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    console.error("API Error:", normalizedError);

    return res.status(500).json({
      success: false,
      message: isDevelopment ? normalizedError.message : "Something went wrong",

      ...(isDevelopment && {
        errorName: normalizedError.name,
        stack: normalizedError.stack,
      }),
    });
  },
);

export default app;

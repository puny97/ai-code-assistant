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
    next: express.NextFunction,
  ) => {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "SOmething went wrong",
    });
  },
);

export default app;

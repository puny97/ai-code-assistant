import { Router } from "express";
import { generateCode } from "./code.controller.js";

const router = Router();

router.post("/generate", generateCode);

export default router;

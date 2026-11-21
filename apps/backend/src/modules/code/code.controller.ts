import { NextFunction, Request, Response } from "express";
import { generateCodeSchema } from "./code.schema.js";
import { codeService } from "./code.service.js";
import { success } from "zod";

export async function generateCode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = generateCodeSchema.safeParse(req.body);

    if (!input.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request",
        errors: input.error.issues,
      });
    }

    const result = await codeService.generate(input.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "@/common/errors/app-error";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, result.error.errors.map((e) => e.message).join("; ")));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new AppError(400, result.error.errors.map((e) => e.message).join("; ")));
      return;
    }
    // Store parsed query separately; some Express/Node versions make req.query read-only.
    (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };
}

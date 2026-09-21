import { Request, Response, NextFunction } from "express";
import { AppError } from "@/common/errors/app-error";
import { logger } from "@/common/utils/logger";
import { env } from "@/common/config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Mongoose duplicate key error (e.g. race condition on unique index)
  if (typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000) {
    res.status(409).json({ error: "A record with these unique values already exists." });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: "Internal server error.",
    ...(env.NODE_ENV !== "production" ? { detail: err instanceof Error ? err.message : String(err) } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `No route: ${req.method} ${req.originalUrl}` });
}

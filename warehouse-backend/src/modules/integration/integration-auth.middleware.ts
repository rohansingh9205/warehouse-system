import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { env } from "@/common/config/env";
import { IntegrationClientModel } from "./integration-client.model";
import { AppError } from "@/common/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";

function hashApiKey(key: string): string {
  return crypto.createHmac("sha256", env.INTEGRATION_SECRET).update(key).digest("hex");
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      integrationClient?: { id: string; name: string };
    }
  }
}

/**
 * Auth for the FUTURE selling website only. Requires an `x-api-key`
 * header issued via scripts/create-integration-client.ts. This is
 * completely separate from admin session cookies — the website never
 * authenticates as a warehouse user.
 */
export async function requireIntegrationApiKey(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const apiKey = req.header("x-api-key");
    if (!apiKey) throw new AppError(401, "Missing API key.");

    const keyHash = hashApiKey(apiKey);
    const client = await IntegrationClientModel.findOne({ apiKeyHash: keyHash, isActive: true, revokedAt: { $exists: false } });

    if (!client) {
      await recordAuditEvent({
        eventType: "UNAUTHORIZED_ATTEMPT",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: { path: req.originalUrl, reason: "invalid_integration_api_key" },
      });
      throw new AppError(401, "Invalid API key.");
    }

    client.lastUsedAt = new Date();
    await client.save();

    req.integrationClient = { id: client._id.toString(), name: client.clientName };

    await recordAuditEvent({
      eventType: "INTEGRATION_API_ACCESS",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { path: req.originalUrl, client: client.clientName },
    });

    next();
  } catch (err) {
    next(err);
  }
}

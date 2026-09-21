import { AuditEventType, AuditLogModel } from "./audit-log.model";
import { Types } from "mongoose";

interface RecordAuditInput {
  eventType: AuditEventType;
  actorUserId?: Types.ObjectId | string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

const FORBIDDEN_METADATA_KEYS = ["password", "otp", "otpCode", "sessionSecret", "apiSecret", "token"];

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.some((f) => key.toLowerCase().includes(f))) continue;
    clean[key] = value;
  }
  return clean;
}

export async function recordAuditEvent(input: RecordAuditInput): Promise<void> {
  await AuditLogModel.create({
    ...input,
    metadata: sanitizeMetadata(input.metadata),
  });
}

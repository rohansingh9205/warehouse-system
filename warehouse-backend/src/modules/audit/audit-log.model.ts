import { Schema, model, Document, Types } from "mongoose";

export type AuditEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "LOGOUT_ALL_DEVICES"
  | "OTP_REQUESTED"
  | "OTP_FAILED"
  | "OTP_LOCKED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_ARCHIVED"
  | "PRODUCT_RESTORED"
  | "PRODUCT_PERMANENTLY_DELETED"
  | "ADMIN_CREATED"
  | "ADMIN_DISABLED"
  | "ADMIN_ENABLED"
  | "QR_CHANGED"
  | "UNAUTHORIZED_ATTEMPT"
  | "INTEGRATION_API_ACCESS"
  | "SECURITY_EVENT";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  eventType: AuditEventType;
  actorUserId?: Types.ObjectId;
  actorRole?: string;
  targetType?: string; // e.g. "Product", "User"
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>; // NEVER put password/OTP/secrets here
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  eventType: { type: String, required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
  actorRole: { type: String },
  targetType: { type: String },
  targetId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: true },
});

auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });

export const AuditLogModel = model<IAuditLog>("AuditLog", auditLogSchema);

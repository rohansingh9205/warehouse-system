import { Schema, model, Document, Types } from "mongoose";

export type OtpChannel = "PHONE" | "EMAIL";
export type OtpPurpose = "REGISTRATION" | "LOGIN_2FA" | "PASSWORD_RESET";

export interface IOtpVerification extends Document {
  _id: Types.ObjectId;
  destination: string; // phone or email, whichever channel
  channel: OtpChannel;
  purpose: OtpPurpose;
  codeHash: string; // never store raw OTP
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  consumedAt?: Date;
  lockedUntil?: Date;
  lastSentAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtpVerification>({
  destination: { type: String, required: true, index: true },
  channel: { type: String, enum: ["PHONE", "EMAIL"], required: true },
  purpose: { type: String, enum: ["REGISTRATION", "LOGIN_2FA", "PASSWORD_RESET"], required: true },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date },
  lockedUntil: { type: Date },
  lastSentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Auto-purge long after expiry (keeps a short forensic window, then removes).
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
otpSchema.index({ destination: 1, purpose: 1, channel: 1 });

export const OtpModel = model<IOtpVerification>("OtpVerification", otpSchema);

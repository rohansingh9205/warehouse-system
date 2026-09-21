import { Schema, model, Document, Types } from "mongoose";

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string; // hash of the opaque session token stored in the cookie
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  rotatedFrom?: Types.ObjectId; // session rotation chain
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: { type: String },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date },
  rotatedFrom: { type: Schema.Types.ObjectId, ref: "Session" },
});

// TTL index: MongoDB auto-purges expired sessions.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<ISession>("Session", sessionSchema);

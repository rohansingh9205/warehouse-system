import { Schema, model, Document, Types } from "mongoose";

/**
 * A client of the future selling website integration. Each client
 * (e.g. "selling-website-prod") gets its OWN API key — never the Super
 * Admin's login credentials. Keys are stored hashed, same principle as
 * passwords/session tokens.
 */
export interface IIntegrationClient extends Document {
  _id: Types.ObjectId;
  clientName: string;
  apiKeyHash: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

const integrationClientSchema = new Schema<IIntegrationClient>({
  clientName: { type: String, required: true, unique: true },
  apiKeyHash: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
  revokedAt: { type: Date },
});

export const IntegrationClientModel = model<IIntegrationClient>("IntegrationClient", integrationClientSchema);

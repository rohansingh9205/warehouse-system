import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "SUPER_ADMIN" | "ADMIN";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string; // E.164, unique
  email: string; // lowercase, unique
  passwordHash: string; // argon2id
  role: UserRole;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  disabledAt?: Date;
  disabledBy?: Types.ObjectId;
  passwordChangedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["SUPER_ADMIN", "ADMIN"], required: true, default: "ADMIN" },
    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    disabledAt: { type: Date },
    disabledBy: { type: Schema.Types.ObjectId, ref: "User" },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

// Uniqueness (case-insensitive for email via lowercase storage)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export const UserModel = model<IUser>("User", userSchema);

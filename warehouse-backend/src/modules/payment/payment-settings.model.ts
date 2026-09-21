import { Schema, model, Document, Types } from "mongoose";

/**
 * v1: display-only payment QR. Deliberately minimal and modular so a real
 * gateway (Razorpay/UPI) can be plugged in later without reshaping this
 * collection — future fields would be additive (e.g. `provider`,
 * `gatewayConfig`), never breaking `qrImage`.
 */
export interface IPaymentSettings extends Document {
  _id: Types.ObjectId;
  qrImage?: {
    secureUrl: string;
    publicId: string;
  };
  updatedBy: Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const paymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    qrImage: {
      secureUrl: { type: String },
      publicId: { type: String },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const PaymentSettingsModel = model<IPaymentSettings>("PaymentSettings", paymentSettingsSchema);

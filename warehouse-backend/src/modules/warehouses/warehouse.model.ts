import { Schema, model, Document, Types } from "mongoose";

export interface IWarehouse extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string; // stable business identifier, e.g. MAIN-WAREHOUSE
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

warehouseSchema.index({ code: 1 }, { unique: true });

export const WarehouseModel = model<IWarehouse>("Warehouse", warehouseSchema);

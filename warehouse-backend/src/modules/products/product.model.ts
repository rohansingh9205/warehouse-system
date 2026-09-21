import { Schema, model, Document, Types } from "mongoose";

/**
 * Categories are NOT a hard-coded enum of exactly two values. They live in
 * a separate `categories` collection (see category.model.ts) so new
 * categories (e.g. LEHENGA, DUPATTA) can be added later without a schema
 * migration. `category` here stores the category CODE (string), validated
 * against the categories collection at the service layer, not at the
 * Mongoose schema layer.
 */

export interface IProductImage {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  sortOrder: number;
  isPrimary: boolean;
}

export type InventoryStatus = "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
export type PublicVisibility = "PRIVATE" | "PUBLIC";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  sku: string; // stable business identifier, unique, case-insensitive
  name: string;
  category: string; // references Category.code
  description?: string;
  fabric?: string;
  color?: string;
  design?: string;
  size?: string;
  price: number;
  stockQuantity: number;
  inventoryStatus: InventoryStatus;
  publicVisibility: PublicVisibility;
  warehouseId: Types.ObjectId;
  images: IProductImage[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId;
}

const productImageSchema = new Schema<IProductImage>(
  {
    secureUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    format: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 5000 },
    fabric: { type: String, trim: true },
    color: { type: String, trim: true },
    design: { type: String, trim: true },
    size: { type: String, trim: true },
    price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
    stockQuantity: { type: Number, required: true, min: [0, "Stock cannot be negative"], default: 0 },
    inventoryStatus: {
      type: String,
      enum: ["ACTIVE", "OUT_OF_STOCK", "ARCHIVED"],
      default: "ACTIVE",
    },
    publicVisibility: { type: String, enum: ["PRIVATE", "PUBLIC"], default: "PRIVATE" },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    images: { type: [productImageSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Case-insensitive unique SKU via collation.
productSchema.index({ sku: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
productSchema.index({ category: 1 });
productSchema.index({ inventoryStatus: 1 });
productSchema.index({ publicVisibility: 1 });
productSchema.index({ warehouseId: 1 });
productSchema.index({ createdAt: -1 });
// Compound indexes matching real query patterns (integration API + dashboard filters).
productSchema.index({ publicVisibility: 1, inventoryStatus: 1, category: 1 });
productSchema.index({ name: "text", fabric: "text", color: "text", sku: "text" });

export const ProductModel = model<IProduct>("Product", productSchema);

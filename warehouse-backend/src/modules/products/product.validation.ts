import { z } from "zod";

// export const skuSchema = z
//   .string()
//   .trim()
//   .min(3)
//   .max(40)
//   .regex(/^[A-Za-z0-9-]+$/, "SKU may only contain letters, numbers and hyphens");

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),

  category: z.string().trim().min(2).max(50),

  description: z.string().trim().max(5000).optional(),

  fabric: z.string().trim().max(100).optional(),

  color: z.string().trim().max(60).optional(),

  design: z.string().trim().max(100).optional(),

  size: z.string().trim().max(30).optional(),

  price: z.number().nonnegative("Price cannot be negative"),

  stockQuantity: z.number().int().nonnegative("Stock cannot be negative"),

  inventoryStatus: z
    .enum(["ACTIVE", "OUT_OF_STOCK", "ARCHIVED"])
    .default("ACTIVE"),

  publicVisibility: z
    .enum(["PRIVATE", "PUBLIC"])
    .default("PRIVATE"),

  warehouseId: z.string().length(24, "Invalid warehouseId"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  // SKU changes are disallowed post-creation to protect integration stability;
  // if truly needed, require an explicit separate re-SKU workflow.
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().optional(),
  inventoryStatus: z.enum(["ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]).optional(),
  publicVisibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
  warehouseId: z.string().length(24).optional(),
  stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
});

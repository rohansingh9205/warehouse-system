import { IProduct } from "@/modules/products/product.model";

/**
 * The ONLY shape the future selling website ever sees. Internal fields —
 * _id, createdBy, warehouseId, archivedBy, audit metadata — are never
 * exposed. If the internal schema changes, this mapper is the single
 * place to update so /api/v1/integration contracts stay stable.
 */
export interface PublicProductDto {
  sku: string;
  name: string;
  category: string;
  price: number;
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  stockQuantity: number;
  description?: string;
  fabric?: string;
  color?: string;
  design?: string;
  size?: string;
  images: { url: string; width: number; height: number; isPrimary: boolean }[];
  updatedAt: string;
}

export function toPublicProductDto(product: IProduct): PublicProductDto {
  return {
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    availability: product.stockQuantity > 0 && product.inventoryStatus === "ACTIVE" ? "IN_STOCK" : "OUT_OF_STOCK",
    stockQuantity: product.stockQuantity,
    description: product.description,
    fabric: product.fabric,
    color: product.color,
    design: product.design,
    size: product.size,
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ url: img.secureUrl, width: img.width, height: img.height, isPrimary: img.isPrimary })),
    updatedAt: product.updatedAt.toISOString(),
  };
}

/** Only products that are safe for the public/website to see. */
export function publicVisibilityFilter() {
  return { publicVisibility: "PUBLIC" as const, inventoryStatus: { $ne: "ARCHIVED" as const } };
}

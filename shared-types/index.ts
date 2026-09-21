/**
 * Shared types between warehouse-backend and warehouse-frontend (and,
 * indirectly, documentation for what the future selling website receives
 * from /api/v1/integration — though that boundary is intentionally also
 * duplicated in docs/INTEGRATION.md as plain JSON so that project doesn't
 * need to depend on this package at all).
 *
 * This package is optional: both warehouse-frontend and warehouse-backend
 * currently define their own local copies of these shapes (see
 * warehouse-frontend/src/types/index.ts and the Mongoose model interfaces
 * in warehouse-backend/src/modules/*​/*.model.ts) so that each app can be
 * built and deployed with zero cross-repo dependency, per the
 * independence requirement. Wire this package in later (e.g. as an npm
 * workspace) only if duplication becomes a real maintenance cost.
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN";
export type InventoryStatus = "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
export type PublicVisibility = "PRIVATE" | "PUBLIC";

export interface ProductImageDto {
  url: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

/** The exact shape returned by /api/v1/integration/products(/:sku). */
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
  images: ProductImageDto[];
  updatedAt: string;
}

export interface PaginatedDto<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

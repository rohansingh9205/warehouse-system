export type UserRole = "SUPER_ADMIN" | "ADMIN";

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type InventoryStatus = "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
export type PublicVisibility = "PRIVATE" | "PUBLIC";

export interface ProductImage {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  fabric?: string;
  color?: string;
  design?: string;
  size?: string;
  price: number;
  stockQuantity: number;
  inventoryStatus: InventoryStatus;
  publicVisibility: PublicVisibility;
  warehouseId: string;
  images: ProductImage[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface DashboardCounts {
  totalProducts: number;
  totalStock: number;
  silkSuits: number;
  sarees: number;
  outOfStock: number;
  archived: number;
}

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Category {
  _id: string;
  code: string;
  label: string;
  isActive: boolean;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  _id: string;
  eventType: string;
  actorUserId?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

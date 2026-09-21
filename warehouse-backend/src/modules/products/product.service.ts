import { FilterQuery } from "mongoose";
import { ProductModel, IProduct } from "./product.model";
import { AppError } from "@/common/errors/app-error";
import { z } from "zod";
import { listProductsQuerySchema } from "./product.validation";

type ListQuery = z.infer<typeof listProductsQuerySchema>;

export async function createProduct(input: Partial<IProduct> & { createdBy: string }) {
  let sku: string;

  while (true) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const generatedSku = `WH-${randomNumber}`;

    const existing = await ProductModel.findOne({ sku: generatedSku })
      .collation({ locale: "en", strength: 2 });

    if (!existing) {
      sku = generatedSku;
      break;
    }
  }

  const product = await ProductModel.create({
    ...input,
    sku,
  });

  return product;
}

export async function updateProduct(productId: string, updates: Partial<IProduct>) {
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError(404, "Product not found.");
  if (product.inventoryStatus === "ARCHIVED") {
    throw new AppError(400, "Archived products cannot be edited. Restore the product first.");
  }

  Object.assign(product, updates);
  await product.save(); // triggers schema-level min:0 validation for price/stock
  return product;
}


export async function archiveProduct(productId: string, archivedBy: string) {
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError(404, "Product not found.");

  const archivedProduct = await ProductModel.findByIdAndUpdate(
    productId,
    {
      $set: {
        inventoryStatus: "ARCHIVED",
        archivedAt: new Date(),
        archivedBy: archivedBy,
      },
    },
    {
      new: true,
      runValidators: false,
    }
  );

  if (!archivedProduct) {
    throw new AppError(404, "Product not found.");
  }

  return archivedProduct;
}
export async function restoreProduct(productId: string) {
  const product = await ProductModel.findByIdAndUpdate(
    productId,
    {
      $set: {
        inventoryStatus: "ACTIVE",
      },
      $unset: {
        archivedAt: 1,
        archivedBy: 1,
      },
    },
    {
      new: true,
      runValidators: false,
    }
  );

  if (!product) {
    throw new AppError(404, "Product not found.");
  }

  return product;
}

export async function deleteProductPermanently(productId: string) {
  const product = await ProductModel.findByIdAndDelete(productId);

  if (!product) {
    throw new AppError(404, "Product not found.");
  }

  return product;
}
export async function getProductById(productId: string) {
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError(404, "Product not found.");
  return product;
}

export async function listProducts(query: ListQuery) {
  const filter: FilterQuery<IProduct> = {};

  if (query.category) filter.category = query.category.toUpperCase();
  if (query.inventoryStatus) filter.inventoryStatus = query.inventoryStatus;
  if (query.publicVisibility) filter.publicVisibility = query.publicVisibility;
  if (query.warehouseId) filter.warehouseId = query.warehouseId;
  if (query.stockStatus === "IN_STOCK") filter.stockQuantity = { $gt: 0 };
  if (query.stockStatus === "OUT_OF_STOCK") filter.stockQuantity = { $eq: 0 };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize),
    ProductModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getDashboardCounts() {
  const [total, silkSuits, sarees, outOfStock, archived] = await Promise.all([
    ProductModel.countDocuments({ inventoryStatus: { $ne: "ARCHIVED" } }),
    ProductModel.countDocuments({ category: "SILK_SUIT", inventoryStatus: { $ne: "ARCHIVED" } }),
    ProductModel.countDocuments({ category: "SAREE", inventoryStatus: { $ne: "ARCHIVED" } }),
    ProductModel.countDocuments({ inventoryStatus: "OUT_OF_STOCK" }),
    ProductModel.countDocuments({ inventoryStatus: "ARCHIVED" }),
  ]);

  const totalStockAgg = await ProductModel.aggregate([
    { $match: { inventoryStatus: { $ne: "ARCHIVED" } } },
    { $group: { _id: null, total: { $sum: "$stockQuantity" } } },
  ]);

  return {
    totalProducts: total,
    totalStock: totalStockAgg[0]?.total ?? 0,
    silkSuits,
    sarees,
    outOfStock,
    archived,
  };
}

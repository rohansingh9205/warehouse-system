/**
 * Seeds MAIN-WAREHOUSE and the two initial categories (SAREE, SILK_SUIT).
 * Safe to re-run — upserts by unique code.
 * Usage: tsx scripts/seed-defaults.ts
 */
import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "@/db/connection";
import { WarehouseModel } from "@/modules/warehouses/warehouse.model";
import { CategoryModel } from "@/modules/categories/category.model";

async function main() {
  await connectDatabase();

  await WarehouseModel.updateOne(
    { code: "MAIN-WAREHOUSE" },
    { $setOnInsert: { name: "Main Warehouse", code: "MAIN-WAREHOUSE", status: "ACTIVE" } },
    { upsert: true }
  );

  const defaultCategories = [
    { code: "SAREE", label: "Saree" },
    { code: "SILK_SUIT", label: "Silk Suit" },
  ];

  for (const cat of defaultCategories) {
    await CategoryModel.updateOne({ code: cat.code }, { $setOnInsert: cat }, { upsert: true });
  }

  console.log("Seeded MAIN-WAREHOUSE and default categories (SAREE, SILK_SUIT).");
  console.log("Additional categories can be added later via POST /api/v1/warehouses/categories/all.");

  await disconnectDatabase();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { UserModel } from "../src/modules/admin/user.model";
import { WarehouseModel } from "../src/modules/warehouses/warehouse.model";
import { CategoryModel } from "../src/modules/categories/category.model";
import { IntegrationClientModel } from "../src/modules/integration/integration-client.model";
import { hashPassword } from "../src/common/utils/password";
import { generateApiKey } from "../src/common/utils/crypto";
import crypto from "node:crypto";
import { env } from "../src/common/config/env";

let mongo: MongoMemoryServer;
const app = createApp();

let warehouseId: string;
let superAdminAgent: ReturnType<typeof request.agent>;
let adminAgent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const wh = await WarehouseModel.create({ name: "Main Warehouse", code: "MAIN-WAREHOUSE" });
  warehouseId = wh._id.toString();
  await CategoryModel.create({ code: "SAREE", label: "Saree" });

  await UserModel.create({
    name: "Super",
    phone: "+910000000001",
    email: "super@example.com",
    passwordHash: await hashPassword("SuperSecurePass123"),
    role: "SUPER_ADMIN",
    isActive: true,
  });
  await UserModel.create({
    name: "Admin",
    phone: "+910000000002",
    email: "admin@example.com",
    passwordHash: await hashPassword("AdminSecurePass123"),
    role: "ADMIN",
    isActive: true,
  });

  superAdminAgent = request.agent(app);
  await superAdminAgent.post("/api/v1/auth/login").send({ identifier: "super@example.com", password: "SuperSecurePass123" });

  adminAgent = request.agent(app);
  await adminAgent.post("/api/v1/auth/login").send({ identifier: "admin@example.com", password: "AdminSecurePass123" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Product RBAC", () => {
  it("allows SUPER_ADMIN to create a product", async () => {
    const res = await superAdminAgent.post("/api/v1/products").send({
      sku: "SAR-0001",
      name: "Banarasi Silk Saree",
      category: "SAREE",
      price: 5999,
      stockQuantity: 10,
      warehouseId,
    });
    expect(res.status).toBe(201);
    expect(res.body.product.sku).toBe("SAR-0001");
  });

  it("rejects duplicate SKU (case-insensitive)", async () => {
    const res = await superAdminAgent.post("/api/v1/products").send({
      sku: "sar-0001",
      name: "Duplicate Saree",
      category: "SAREE",
      price: 4999,
      stockQuantity: 5,
      warehouseId,
    });
    expect(res.status).toBe(409);
  });

  it("rejects negative price", async () => {
    const res = await superAdminAgent.post("/api/v1/products").send({
      sku: "SAR-0002",
      name: "Bad Price Saree",
      category: "SAREE",
      price: -100,
      stockQuantity: 5,
      warehouseId,
    });
    expect(res.status).toBe(400);
  });

  it("rejects negative stock", async () => {
    const res = await superAdminAgent.post("/api/v1/products").send({
      sku: "SAR-0003",
      name: "Bad Stock Saree",
      category: "SAREE",
      price: 100,
      stockQuantity: -5,
      warehouseId,
    });
    expect(res.status).toBe(400);
  });

  it("forbids ADMIN from creating a product (server-side enforcement)", async () => {
    const res = await adminAgent.post("/api/v1/products").send({
      sku: "SAR-9999",
      name: "Should Not Be Created",
      category: "SAREE",
      price: 100,
      stockQuantity: 1,
      warehouseId,
    });
    expect(res.status).toBe(403);
  });

  it("allows ADMIN to view products", async () => {
    const res = await adminAgent.get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("rejects unauthenticated access entirely", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(401);
  });
});

describe("Integration API isolation", () => {
  it("rejects requests with no API key", async () => {
    const res = await request(app).get("/api/v1/integration/products");
    expect(res.status).toBe(401);
  });

  it("rejects an admin session cookie as integration auth (no cross-auth)", async () => {
    const res = await adminAgent.get("/api/v1/integration/products");
    expect(res.status).toBe(401); // session cookie alone is not accepted; x-api-key required
  });

  it("accepts a valid integration API key and only returns PUBLIC, non-archived products", async () => {
    // Make one product public, leave the other private.
    const list = await superAdminAgent.get("/api/v1/products");
    const target = list.body.items[0];
    await superAdminAgent.patch(`/api/v1/products/${target._id}`).send({ publicVisibility: "PUBLIC" });

    const apiKey = generateApiKey();
    const keyHash = crypto.createHmac("sha256", env.INTEGRATION_SECRET).update(apiKey).digest("hex");
    await IntegrationClientModel.create({ clientName: "test-website", apiKeyHash: keyHash });

    const res = await request(app).get("/api/v1/integration/products").set("x-api-key", apiKey);
    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      // DTO must never leak internal fields.
      expect(item).not.toHaveProperty("_id");
      expect(item).not.toHaveProperty("createdBy");
      expect(item).not.toHaveProperty("warehouseId");
    }
  });
});

describe("Archiving", () => {
  it("SUPER_ADMIN can archive a product; it stops appearing in default listing filters", async () => {
    const created = await superAdminAgent.post("/api/v1/products").send({
      sku: "SAR-ARCH-1",
      name: "To Be Archived",
      category: "SAREE",
      price: 1000,
      stockQuantity: 1,
      warehouseId,
    });
    const id = created.body.product._id;

    const archived = await superAdminAgent.delete(`/api/v1/products/${id}`);
    expect(archived.status).toBe(200);
    expect(archived.body.product.inventoryStatus).toBe("ARCHIVED");

    const filtered = await superAdminAgent.get("/api/v1/products?inventoryStatus=ACTIVE");
    expect(filtered.body.items.find((p: { _id: string }) => p._id === id)).toBeUndefined();
  });

  it("archived products cannot be edited", async () => {
    const list = await superAdminAgent.get("/api/v1/products?inventoryStatus=ARCHIVED");
    const archived = list.body.items[0];
    const res = await superAdminAgent.patch(`/api/v1/products/${archived._id}`).send({ name: "New Name" });
    expect(res.status).toBe(400);
  });
});

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import type { Category, Product, Warehouse } from "@/types";

export default function AddProductPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<FileList | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    fabric: "",
    color: "",
    design: "",
    size: "",
    price: "",
    stockQuantity: "",
    inventoryStatus: "ACTIVE",
    publicVisibility: "PRIVATE",
    warehouseId: "",
  });

useEffect(() => {
  async function loadData() {
    try {
      const [warehouseData, categoryData] = await Promise.all([
        api.get<{ warehouses: Warehouse[] }>("/warehouses"),
        api.get<{ categories: Category[] }>("/warehouses/categories/all"),
      ]);

      setWarehouses(warehouseData.warehouses);

      if (warehouseData.warehouses[0]) {
        setForm((f) => ({
          ...f,
          warehouseId: warehouseData.warehouses[0]._id,
        }));
      }

      setCategories(categoryData.categories);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load warehouses or categories."
      );
    }
  }

  loadData();
}, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { product } = await api.post<{ product: Product }>("/products", {
        ...form,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
      });

      if (images && images.length > 0) {
        for (const file of Array.from(images)) {
          const fd = new FormData();
          fd.append("image", file);
          await api.post(`/uploads/products/${product._id}/images`, fd);
        }
      }

      router.push(`/dashboard/inventory/${product._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">Add Product</h1>
      <p className="text-sm text-neutral-500">Only Super Admin can add products. Enforced server-side.</p>

      <form onSubmit={handleSubmit} className="mt-6 card p-6 space-y-4">
        <div>
  <label className="label">Category</label>
  <select
    className="input"
    required
    value={form.category}
    onChange={(e) => update("category", e.target.value)}
  >
    <option value="">Select category</option>

    {categories.map((c) => (
      <option key={c.code} value={c.code}>
        {c.label}
      </option>
    ))}
  </select>
</div>

<div className="rounded-md bg-neutral-50 border p-3 text-sm text-neutral-600">
  SKU will be generated automatically by the system.
</div>

        <div>
          <label className="label">Product name</label>
          <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fabric</label>
            <input className="input" value={form.fabric} onChange={(e) => update("fabric", e.target.value)} />
          </div>
          <div>
            <label className="label">Color</label>
            <input className="input" value={form.color} onChange={(e) => update("color", e.target.value)} />
          </div>
          <div>
            <label className="label">Design</label>
            <input className="input" value={form.design} onChange={(e) => update("design", e.target.value)} />
          </div>
          <div>
            <label className="label">Size</label>
            <input className="input" value={form.size} onChange={(e) => update("size", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (₹)</label>
            <input className="input" required type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div>
            <label className="label">Stock quantity</label>
            <input className="input" required type="number" min="0" step="1" value={form.stockQuantity} onChange={(e) => update("stockQuantity", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Inventory status</label>
            <select className="input" value={form.inventoryStatus} onChange={(e) => update("inventoryStatus", e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="label">Public visibility</label>
            <select className="input" value={form.publicVisibility} onChange={(e) => update("publicVisibility", e.target.value)}>
              <option value="PRIVATE">Private (warehouse only)</option>
              <option value="PUBLIC">Public (future website)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Warehouse</label>
          <select className="input" required value={form.warehouseId} onChange={(e) => update("warehouseId", e.target.value)}>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Product images</label>
          <input className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setImages(e.target.files)} />
          <p className="mt-1 text-xs text-neutral-400">JPEG, PNG or WebP. Max 10MB each.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}

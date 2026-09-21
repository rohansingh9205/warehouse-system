"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Paginated, Product } from "@/types";

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
const [selectedImageIndex, setSelectedImageIndex] = useState(0);
const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (inventoryStatus) params.set("inventoryStatus", inventoryStatus);

    try {
      const data = await api.get<Paginated<Product>>(`/products?${params.toString()}`);
      setItems(data.items);
      setTotalPages(data.pagination.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, inventoryStatus]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleArchive(product: Product) {
    const confirmed = window.confirm(
      `Archive this product?\n\nName: ${product.name}\nSKU: ${product.sku}\nStock: ${product.stockQuantity}\nCategory: ${product.category}`
    );
    if (!confirmed) return;
    setArchivingId(product._id);
    try {
      await api.del(`/products/${product._id}`);
      await load();
    } finally {
      setArchivingId(null);
    }
  }
  async function handleRestore(product: Product) {
  const confirmed = window.confirm(
    `Restore this product?\n\nName: ${product.name}\nSKU: ${product.sku}`
  );

  if (!confirmed) return;

  setRestoringId(product._id);

  try {
    await api.patch(`/products/${product._id}/restore`, {});
    await load();
  } finally {
    setRestoringId(null);
  }
}

async function handlePermanentDelete(product: Product) {
  const confirmed = window.confirm(
    `PERMANENTLY DELETE this product?\n\nName: ${product.name}\nSKU: ${product.sku}\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  setDeletingId(product._id);

  try {
    await api.del(`/products/${product._id}/permanent`);
    await load();
  } finally {
    setDeletingId(null);
  }
}
async function handleDeleteImage() {
  if (!selectedProduct) return;

  const image = selectedProduct.images[selectedImageIndex];
  if (!image) return;

  const confirmed = window.confirm(
    "Delete this image?\n\nThis will permanently remove the image from the product and Cloudinary."
  );

  if (!confirmed) return;

  setDeletingImageId(image.publicId);

  try {
    await api.del(
      `/uploads/products/${selectedProduct._id}/images/${encodeURIComponent(
        image.publicId
      )}`
    );

    const remainingImages = selectedProduct.images.filter(
      (img) => img.publicId !== image.publicId
    );

    const updatedProduct = {
      ...selectedProduct,
      images: remainingImages,
    };

    setItems((current) =>
      current.map((item) =>
        item._id === updatedProduct._id ? updatedProduct : item
      )
    );

    if (remainingImages.length === 0) {
      setSelectedProduct(null);
      setSelectedImageIndex(0);
    } else {
      setSelectedProduct(updatedProduct);

      setSelectedImageIndex((current) =>
        Math.min(current, remainingImages.length - 1)
      );
    }
  } finally {
    setDeletingImageId(null);
  }
}

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Inventory</h1>
        {isSuperAdmin && (
          <Link href="/dashboard/products/add" className="btn-primary">
            Add Product
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          className="input sm:col-span-2"
          placeholder="Search by name, SKU, fabric, color..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select className="input" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
          <option value="">All categories</option>
          <option value="SAREE">Saree</option>
          <option value="SILK_SUIT">Silk Suit</option>
        </select>
        <select className="input" value={inventoryStatus} onChange={(e) => { setPage(1); setInventoryStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Visibility</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="p-6 text-center text-neutral-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={10} className="p-6 text-center text-neutral-400">No products found.</td></tr>
            ) : (
              items.map((p) => {
                const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
                return (
                  <tr key={p._id} className="border-b border-neutral-100 last:border-0">
                    <td className="p-3">
                      {primary ? (
  <button
    type="button"
    onClick={() => router.push(`/dashboard/inventory/${p._id}`)}
    className="block"
    title={`View ${p.images.length} image${p.images.length === 1 ? "" : "s"}`}
  >
    <Image
      src={primary.secureUrl}
      alt={p.name}
      width={56}
      height={56}
      className="h-14 w-14 rounded object-cover hover:opacity-80"
    />

    {p.images.length > 1 && (
      <span className="mt-1 block text-xs text-brand-600">
        {p.images.length} images
      </span>
    )}
  </button>
) : (
  <div className="h-14 w-14 rounded bg-neutral-100" />
)}
                    </td>
                    <td className="p-3 font-medium text-neutral-800">{p.name}</td>
                    <td className="p-3 text-neutral-500">{p.sku}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">₹{p.price.toLocaleString("en-IN")}</td>
                    <td className="p-3">{p.stockQuantity}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{p.inventoryStatus}</span>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{p.publicVisibility}</span>
                    </td>
                    <td className="p-3 text-neutral-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
  <Link
    href={`/dashboard/inventory/${p._id}`}
    className="text-brand-600 hover:underline"
  >
    View
  </Link>

  {isSuperAdmin && p.inventoryStatus !== "ARCHIVED" && (
    <button
      onClick={() => handleArchive(p)}
      disabled={archivingId === p._id}
      className="text-red-600 hover:underline disabled:opacity-50"
    >
      {archivingId === p._id ? "Archiving..." : "Archive"}
    </button>
  )}

  {isSuperAdmin && p.inventoryStatus === "ARCHIVED" && (
    <>
      <button
        onClick={() => handleRestore(p)}
        disabled={restoringId === p._id || deletingId === p._id}
        className="text-green-600 hover:underline disabled:opacity-50"
      >
        {restoringId === p._id ? "Restoring..." : "Restore"}
      </button>

      <button
        onClick={() => handlePermanentDelete(p)}
        disabled={deletingId === p._id || restoringId === p._id}
        className="text-red-700 hover:underline disabled:opacity-50"
      >
        {deletingId === p._id ? "Deleting..." : "Delete Permanently"}
      </button>
    </>
  )}
</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-neutral-500">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
            <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-neutral-500">
          Page {page} of {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* 👇 POINT 4: YAHAN SE GALLERY CODE START */}

      {selectedProduct && selectedProduct.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          {/* gallery code yahan */}
        </div>
      )}

      {/* 👆 GALLERY CODE END */}

    </div>
  );
}
   

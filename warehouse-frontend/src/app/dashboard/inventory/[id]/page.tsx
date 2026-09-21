"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api-client";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    api.get<{ product: Product }>(`/products/${params.id}`).then((d) => setProduct(d.product));
  }, [params.id]);

  if (!product) return <p className="text-sm text-neutral-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">{product.name}</h1>
      <p className="text-sm text-neutral-500">SKU: {product.sku}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="grid grid-cols-3 gap-2">
            {product.images.length === 0 && <p className="text-sm text-neutral-400">No images uploaded.</p>}
            {product.images.map((img) => (
              <Image
                key={img.publicId}
                src={img.secureUrl}
                alt={product.name}
                width={200}
                height={200}
                className="aspect-square rounded-lg object-cover"
              />
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-2 text-sm">
          <Row label="Category" value={product.category} />
          <Row label="Price" value={`₹${product.price.toLocaleString("en-IN")}`} />
          <Row label="Stock" value={String(product.stockQuantity)} />
          <Row label="Inventory Status" value={product.inventoryStatus} />
          <Row label="Public Visibility" value={product.publicVisibility} />
          <Row label="Fabric" value={product.fabric ?? "—"} />
          <Row label="Color" value={product.color ?? "—"} />
          <Row label="Design" value={product.design ?? "—"} />
          <Row label="Size" value={product.size ?? "—"} />
          <Row label="Description" value={product.description ?? "—"} />
          <Row label="Created" value={new Date(product.createdAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 py-2 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}

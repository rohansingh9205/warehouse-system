"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { DashboardCounts } from "@/types";

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);

  useEffect(() => {
    api.get<{ counts: DashboardCounts }>("/products/dashboard-counts").then((d) => setCounts(d.counts));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Welcome, {user?.name}</h1>
      <p className="text-sm text-neutral-500">Here&apos;s what&apos;s happening in the warehouse today.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card label="Total Products" value={counts?.totalProducts ?? "—"} />
        <Card label="Total Stock" value={counts?.totalStock ?? "—"} />
        <Card label="Silk Suits" value={counts?.silkSuits ?? "—"} />
        <Card label="Sarees" value={counts?.sarees ?? "—"} />
        <Card label="Out of Stock" value={counts?.outOfStock ?? "—"} />
        <Card label="Archived" value={counts?.archived ?? "—"} />
      </div>

      {user?.role === "SUPER_ADMIN" && (
        <div className="mt-8 card p-5">
          <p className="text-sm font-medium text-neutral-800">Super Admin overview</p>
          <p className="mt-1 text-sm text-neutral-500">
            Recently added/archived products and recent security events are available in Inventory and Audit Logs.
          </p>
        </div>
      )}
    </div>
  );
}

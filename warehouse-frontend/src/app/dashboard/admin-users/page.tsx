"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { AdminUser } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<{ users: AdminUser[] }>("/admin/users");
    setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(user: AdminUser) {
    setUpdatingId(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Admin Users</h1>
      <p className="text-sm text-neutral-500">Registration is self-serve for Admins; the initial Super Admin is CLI-provisioned only.</p>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-neutral-400">Loading...</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-neutral-500">{u.email}</td>
                  <td className="p-3 text-neutral-500">{u.phone}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    {u.role !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={updatingId === u._id}
                        className="text-brand-600 hover:underline disabled:opacity-50"
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { AuditLogEntry, Paginated } from "@/types";

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<Paginated<AuditLogEntry>>(`/audit-logs?page=${page}&pageSize=50`);
    setItems(data.items);
    setTotalPages(data.pagination.totalPages || 1);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Audit Logs</h1>
      <p className="text-sm text-neutral-500">Read-only. Logs are never modifiable through the API.</p>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="p-3">Event</th>
              <th className="p-3">Actor role</th>
              <th className="p-3">Target</th>
              <th className="p-3">IP</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-neutral-400">Loading...</td></tr>
            ) : (
              items.map((log) => (
                <tr key={log._id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 font-medium">{log.eventType}</td>
                  <td className="p-3">{log.actorRole ?? "—"}</td>
                  <td className="p-3 text-neutral-500">{log.targetType ? `${log.targetType}:${log.targetId}` : "—"}</td>
                  <td className="p-3 text-neutral-500">{log.ip ?? "—"}</td>
                  <td className="p-3 text-neutral-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
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
    </div>
  );
}

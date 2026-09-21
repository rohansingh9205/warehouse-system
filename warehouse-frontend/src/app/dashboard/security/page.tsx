"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import type { AuditLogEntry, Paginated } from "@/types";

const SECURITY_EVENTS = ["LOGIN_FAILURE", "OTP_FAILED", "OTP_LOCKED", "UNAUTHORIZED_ATTEMPT", "SECURITY_EVENT"];

export default function SecurityPage() {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    Promise.all(
      SECURITY_EVENTS.map((type) => api.get<Paginated<AuditLogEntry>>(`/audit-logs?eventType=${type}&pageSize=10`))
    ).then((results) => {
      const merged = results.flatMap((r) => r.items).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setEvents(merged.slice(0, 20));
    });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Security</h1>
      <p className="text-sm text-neutral-500">
        Session, OTP, and rate-limit configuration live in the backend&apos;s environment variables
        (see <code>.env.example</code>) — they are not editable from this UI by design, to keep
        security posture out of reach of a compromised browser session.
      </p>

      <div className="card mt-6 p-5">
        <p className="text-sm font-medium text-neutral-800">Recent security events</p>
        <ul className="mt-3 space-y-2 text-sm">
          {events.length === 0 && <li className="text-neutral-400">No recent security events.</li>}
          {events.map((e) => (
            <li key={e._id} className="flex justify-between border-b border-neutral-100 pb-2 last:border-0">
              <span>{e.eventType}</span>
              <span className="text-neutral-400">{new Date(e.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <Link href="/dashboard/audit-logs" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          View full audit log →
        </Link>
      </div>
    </div>
  );
}

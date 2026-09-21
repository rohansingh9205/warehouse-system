"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface QrImage {
  secureUrl: string;
  publicId: string;
}

export default function PaymentQrPage() {
  const { user } = useAuth();
  const [qr, setQr] = useState<QrImage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await api.get<{ payment: QrImage | null }>("/payment");
    setQr(data.payment);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("qr", file);
      await api.post("/payment/qr", fd);
      setFile(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete the current payment QR?")) return;
    setBusy(true);
    try {
      await api.del("/payment/qr");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-neutral-900">Payment QR</h1>
      <p className="text-sm text-neutral-500">Display-only in v1. Gateway integration (Razorpay/UPI) is a future addition.</p>

      <div className="card mt-4 p-6 text-center">
        {qr ? (
          <Image src={qr.secureUrl} alt="Payment QR" width={240} height={240} className="mx-auto rounded-lg" />
        ) : (
          <p className="py-12 text-sm text-neutral-400">No QR code uploaded yet.</p>
        )}
      </div>

      {isSuperAdmin && (
        <div className="mt-4 space-y-3">
          <input type="file" accept="image/jpeg,image/png,image/webp" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={!file || busy} onClick={handleUpload}>
              {busy ? "Uploading..." : "Upload / Replace"}
            </button>
            {qr && (
              <button className="btn-secondary" disabled={busy} onClick={handleDelete}>
                Delete QR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

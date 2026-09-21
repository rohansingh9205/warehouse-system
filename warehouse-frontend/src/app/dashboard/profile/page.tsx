"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword, confirmNewPassword });
      setMessage("Password updated. Other sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogoutAll() {
    await api.post("/auth/logout-all");
    await logout();
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Profile</h1>
        <div className="card mt-4 p-5 text-sm">
          <p><span className="text-neutral-500">Name:</span> {user?.name}</p>
          <p className="mt-1"><span className="text-neutral-500">Email:</span> {user?.email}</p>
          <p className="mt-1"><span className="text-neutral-500">Role:</span> {user?.role}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-800">Change password</h2>
        <form onSubmit={handleChangePassword} className="card mt-2 space-y-3 p-5">
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">New password (min. 12 characters)</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={12} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input className="input" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required minLength={12} />
          </div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary" disabled={busy} type="submit">{busy ? "Updating..." : "Update password"}</button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-800">Sessions</h2>
        <div className="card mt-2 p-5">
          <p className="text-sm text-neutral-500">Sign out of this account on all devices.</p>
          <button className="btn-secondary mt-3" onClick={handleLogoutAll}>Logout from all devices</button>
        </div>
      </div>
    </div>
  );
}

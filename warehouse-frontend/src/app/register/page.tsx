"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";

type Step = "NAME" | "PHONE" | "PHONE_OTP" | "EMAIL" | "EMAIL_OTP" | "PASSWORD";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("NAME");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function withBusy(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const steps: { key: Step; label: string }[] = [
    { key: "NAME", label: "Name" },
    { key: "PHONE", label: "Phone" },
    { key: "PHONE_OTP", label: "Verify phone" },
    { key: "EMAIL", label: "Email" },
    { key: "EMAIL_OTP", label: "Verify email" },
    { key: "PASSWORD", label: "Password" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-neutral-900">Admin Registration</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Step {stepIndex + 1} of {steps.length}: {steps[stepIndex].label}
        </p>
        <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-200">
          <div
            className="h-1.5 rounded-full bg-brand-600 transition-all"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mt-6 space-y-4">
          {step === "NAME" && (
            <>
              <div>
                <label className="label">Full name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <button
                className="btn-primary w-full"
                disabled={busy || name.trim().length < 2}
                onClick={() => setStep("PHONE")}
              >
                Continue
              </button>
            </>
          )}

          {step === "PHONE" && (
            <>
              <div>
                <label className="label">Phone number</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919999999999" />
              </div>
              <button
                className="btn-primary w-full"
                disabled={busy}
                onClick={() =>
                  withBusy(async () => {
                    await api.post("/auth/request-phone-otp", { phone, purpose: "REGISTRATION" });
                    setStep("PHONE_OTP");
                  })
                }
              >
                {busy ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {step === "PHONE_OTP" && (
            <>
              <div>
                <label className="label">Enter the 6-digit code sent to {phone}</label>
                <input className="input tracking-widest" maxLength={6} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
              </div>
              <button
                className="btn-primary w-full"
                disabled={busy || phoneOtp.length !== 6}
                onClick={() =>
                  withBusy(async () => {
                    await api.post("/auth/verify-phone-otp", { phone, code: phoneOtp, purpose: "REGISTRATION" });
                    setStep("EMAIL");
                  })
                }
              >
                {busy ? "Verifying..." : "Verify"}
              </button>
            </>
          )}

          {step === "EMAIL" && (
            <>
              <div>
                <label className="label">Email address</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button
                className="btn-primary w-full"
                disabled={busy}
                onClick={() =>
                  withBusy(async () => {
                    await api.post("/auth/request-email-otp", { email, purpose: "REGISTRATION" });
                    setStep("EMAIL_OTP");
                  })
                }
              >
                {busy ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {step === "EMAIL_OTP" && (
            <>
              <div>
                <label className="label">Enter the 6-digit code sent to {email}</label>
                <input className="input tracking-widest" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} />
              </div>
              <button
                className="btn-primary w-full"
                disabled={busy || emailOtp.length !== 6}
                onClick={() =>
                  withBusy(async () => {
                    await api.post("/auth/verify-email-otp", { email, code: emailOtp, purpose: "REGISTRATION" });
                    setStep("PASSWORD");
                  })
                }
              >
                {busy ? "Verifying..." : "Verify"}
              </button>
            </>
          )}

          {step === "PASSWORD" && (
            <>
              <div>
                <label className="label">Create password (min. 12 characters)</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <button
                className="btn-primary w-full"
                disabled={busy || password.length < 12}
                onClick={() =>
                  withBusy(async () => {
                    await api.post("/auth/register", { name, phone, email, password, confirmPassword });
                    router.push("/login");
                  })
                }
              >
                {busy ? "Creating account..." : "Complete registration"}
              </button>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 text-sm">
          <Link href="/login" className="text-brand-600 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

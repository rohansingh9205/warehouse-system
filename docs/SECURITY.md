# SECURITY

## Authentication

- Registration (Admin only): name → phone OTP → email OTP → password. Both
  OTPs must show a `consumedAt` record for `purpose=REGISTRATION` before
  account creation succeeds.
- Super Admin: never creatable via any HTTP route. Provisioned only via
  `npm run seed:super-admin` (interactive password prompt, not a CLI arg).
- Passwords: Argon2id (`memoryCost: 19456`, `timeCost: 2`), 12-character
  minimum, confirmation field, never logged.
- Sessions: opaque random token in an HTTP-only, `SameSite=Lax` cookie;
  only an HMAC hash of the token is stored server-side; TTL-indexed for
  auto-expiry; rotated on login and password change; `logout-all` revokes
  every session for a user. Tokens are never stored in localStorage.

## OTP security

- 6 digits, HMAC-hashed at rest (keyed by `OTP_SECRET`), single-use
  (`consumedAt`), capped attempts with lockout (`OTP_MAX_ATTEMPTS`,
  `OTP_LOCKOUT_MINUTES`), resend cooldown (`OTP_RESEND_COOLDOWN_SECONDS`).
- Verification failures return a generic "Invalid or expired code" message
  regardless of the actual reason, to resist enumeration.
- OTP codes are never written to logs (see redaction paths in
  `src/common/utils/logger.ts`) or included in audit log metadata (see
  `FORBIDDEN_METADATA_KEYS` in `audit.service.ts`).

## Authorization (RBAC)

All role checks happen server-side in `requireRole()` middleware — the
frontend hiding a sidebar link or a button is a UX nicety only. Every
product-mutating route, admin-management route, payment-QR-management
route, and audit-log route explicitly lists which role(s) may call it.
Unauthorized attempts are recorded as `UNAUTHORIZED_ATTEMPT` audit events.

## Rate limiting

Separate limiter instances (see `rate-limiters.ts`) for: login, OTP,
general admin endpoints, image operations, and the integration API — so a
flood against one class (e.g. OTP) cannot starve another (e.g. login).
For a multi-instance production deployment, back these with a shared store
(e.g. `rate-limit-mongo`, already listed as a dependency) instead of the
default in-memory store.

## Injection & common web attacks

- **NoSQL injection**: all request bodies/queries are parsed through Zod
  schemas before touching Mongoose; Mongoose itself also refuses to treat
  arbitrary object keys as operators when values come from validated,
  typed input.
- **XSS**: the frontend is React (auto-escapes by default); the backend
  never renders HTML from user input.
- **CSRF**: `SameSite=Lax` cookies + CORS locked to
  `WAREHOUSE_FRONTEND_ORIGIN` with `credentials: true` mitigate cross-site
  cookie-riding; state-changing routes are POST/PATCH/DELETE only.
- **IDOR/BOLA**: every mutating product/admin/payment route re-checks the
  caller's role server-side; the integration API only ever exposes
  `PUBLIC` + non-archived products regardless of what a client requests.
- **File upload attacks**: MIME type, extension, size, and post-upload
  dimension checks in `cloudinary.service.ts`; uploads go through our
  backend (never a browser-direct/unsigned Cloudinary preset), so the API
  secret never reaches the browser.
- **Session fixation/theft**: session tokens rotate on login/password
  change; cookies are HTTP-only and (in production) `Secure`.
- **Privilege escalation**: registration always creates `role: "ADMIN"`;
  there is no route that lets any authenticated user set their own role.

## Secrets handling

- `.env.example` lists every required variable with no real values.
- `SESSION_SECRET`, `OTP_SECRET`, `INTEGRATION_SECRET`, and Cloudinary/
  provider API keys exist only on the backend process — never sent to the
  frontend bundle (Next.js `NEXT_PUBLIC_*` vars are the only ones exposed
  to the browser, and only `NEXT_PUBLIC_WAREHOUSE_API_URL` is defined).
- Audit log metadata is sanitized to strip any key containing `password`,
  `otp`, `sessionSecret`, `apiSecret`, or `token` before it is persisted.

## Database security

- The app connects with a dedicated, least-privilege MongoDB user (never
  an admin/root credential) — configure this in your Atlas project, not in
  code.
- Restrict network access (IP allowlist / VPC peering) at the MongoDB Atlas
  level.
- TLS is enforced by the `mongodb+srv://` connection string format.

## Reporting gaps

This is a v1 security baseline covering the spec's explicit requirements.
Before production launch, run a dependency audit (`npm audit`), enable a
shared-store rate limiter, put the API behind a WAF/reverse proxy with
HTTPS termination, and consider a professional penetration test.

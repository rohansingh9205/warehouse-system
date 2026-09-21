# Testing

## Automated tests

Automated tests live in `warehouse-backend/tests/` (Vitest + Supertest +
mongodb-memory-server — an in-memory MongoDB, no external DB needed to run
them):

- `unit.password-otp.test.ts` — Argon2id round-trip, password strength
  rule, OTP hashing/timing-safe comparison.
- `integration.rbac-and-integration-api.test.ts` — SKU uniqueness
  (case-insensitive), negative price/stock rejection, ADMIN vs SUPER_ADMIN
  RBAC on product routes, unauthenticated access rejection, integration
  API key isolation (a session cookie does NOT work as integration auth
  and vice versa), public DTO never leaking internal fields, archive
  behavior (excluded from default filters, immutable once archived).

Run with:

```bash
cd warehouse-backend
npm install
npm test
```

**Sandbox note:** `mongodb-memory-server` downloads a MongoDB binary on
first run, which requires network access — this could not be executed
inside the offline sandbox this project was authored in, so treat these as
written-but-unexecuted tests. Run `npm test` locally (with internet
access) before relying on them, and fix forward from there.

## What's covered vs. what needs manual/exploratory testing

The original spec's test list (§37) maps as follows:

| Area | Status |
|---|---|
| Authentication (register/login/logout/logout-all) | Automated (login RBAC tests) + needs manual OTP-flow click-through |
| Authorization (Admin vs Super Admin) | Automated |
| Product creation / negative stock / negative price / duplicate SKU | Automated |
| Product archiving | Automated |
| Search / filtering / pagination | Needs additional automated coverage — currently exercised manually via the Inventory page |
| Cloudinary uploads / invalid images | Needs a real Cloudinary sandbox account to test end-to-end; `validateImageFile`/`validateImageDimensions` unit tests should be added once a fixture image set exists |
| NoSQL injection | Zod schemas reject non-conforming payload shapes before they reach Mongoose; add explicit injection-payload test cases (e.g. `{ "$gt": "" }` in string fields) |
| IDOR | Automated (integration API DTO leak test); extend to cover cross-tenant product/user ID guessing once multi-warehouse ACLs exist |
| Role escalation | Automated (registration always creates `ADMIN`; no self-role-change route exists) |
| Rate limiting | Needs a dedicated test hitting `/auth/login` past `LOGIN_RATE_LIMIT_PER_15MIN` and asserting a 429 |
| Integration API / API versioning | Automated (API key isolation); versioning itself is enforced by process (see docs/API.md), not a runtime check to test |
| Unauthorized website access | Automated (`x-api-key` required; admin session rejected) |

## Manual pre-launch checklist

- [ ] Full registration flow through the actual UI with a real SMS/Email
      provider wired into `otp.service.ts`'s `dispatchOtp()`
- [ ] Confirm `COOKIE_SECURE=true` and HTTPS end-to-end in staging
- [ ] Confirm CORS rejects an origin other than `WAREHOUSE_FRONTEND_ORIGIN`
- [ ] Upload an oversized / wrong-MIME-type image and confirm rejection
- [ ] Disable an Admin account and confirm their existing session is killed
      immediately (not just on next login)
- [ ] Exceed OTP resend cooldown and confirm 429
- [ ] Exceed OTP max attempts and confirm lockout window
- [ ] Confirm `npm run seed:super-admin` cannot be triggered remotely (no
      HTTP route exists for it — verify by grepping the routes)

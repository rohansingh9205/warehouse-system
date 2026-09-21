# API Reference (`/api/v1`)

Base URL (dev): `http://localhost:4000/api/v1`

All admin-facing routes require the `wh_sid` HTTP-only session cookie
(set automatically by `/auth/login`). All integration routes require an
`x-api-key` header instead — see `docs/INTEGRATION.md`.

Breaking changes are never made to `/api/v1` once released; a `/api/v2`
would be introduced instead, and `/api/v1` kept running for existing
consumers.

## Auth — `/api/v1/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/request-phone-otp` | none | rate-limited |
| POST | `/verify-phone-otp` | none | rate-limited |
| POST | `/request-email-otp` | none | rate-limited |
| POST | `/verify-email-otp` | none | rate-limited |
| POST | `/register` | none | creates an ADMIN only; requires both OTPs verified first |
| POST | `/login` | none | rate-limited; sets session cookie |
| POST | `/logout` | session | revokes current session |
| POST | `/logout-all` | session | revokes every session for the user |
| GET | `/me` | session | current user info |
| POST | `/change-password` | session | rotates session, revokes other sessions |
| POST | `/reset-password` | none | requires OTP verification, rate-limited |

## Products — `/api/v1/products`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/` | ADMIN, SUPER_ADMIN | search/filter/pagination via query params |
| GET | `/dashboard-counts` | ADMIN, SUPER_ADMIN | dashboard card counts |
| GET | `/:id` | ADMIN, SUPER_ADMIN | single product |
| POST | `/` | SUPER_ADMIN | create |
| PATCH | `/:id` | SUPER_ADMIN | update (SKU immutable post-creation) |
| DELETE | `/:id` | SUPER_ADMIN | soft-archive (sets `inventoryStatus=ARCHIVED`) |

Query params for `GET /products`: `page`, `pageSize`, `search`, `category`,
`inventoryStatus`, `publicVisibility`, `warehouseId`, `stockStatus`.

## Uploads — `/api/v1/uploads` (SUPER_ADMIN only)

| Method | Path | Notes |
|---|---|---|
| POST | `/products/:productId/images` | multipart `image` field, signed upload to Cloudinary |
| DELETE | `/products/:productId/images/:publicIdEncoded` | `publicId` must be URL-encoded |

## Admin users — `/api/v1/admin` (SUPER_ADMIN only)

| Method | Path | Notes |
|---|---|---|
| GET | `/users` | list all Admin/Super Admin accounts |
| PATCH | `/users/:id/status` | `{ isActive: boolean }`; disabling force-revokes sessions |

## Warehouses & categories — `/api/v1/warehouses`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/` | ADMIN, SUPER_ADMIN | list warehouses |
| POST | `/` | SUPER_ADMIN | create warehouse |
| GET | `/categories/all` | ADMIN, SUPER_ADMIN | list categories |
| POST | `/categories/all` | SUPER_ADMIN | add a new category (not limited to 2) |

## Payment — `/api/v1/payment`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/` | ADMIN, SUPER_ADMIN | current QR |
| POST | `/qr` | SUPER_ADMIN | upload/replace |
| DELETE | `/qr` | SUPER_ADMIN | remove |

## Audit logs — `/api/v1/audit-logs` (SUPER_ADMIN only, read-only)

| Method | Path | Notes |
|---|---|---|
| GET | `/` | `page`, `pageSize`, optional `eventType` filter. No write routes exist. |

## Integration (future website) — `/api/v1/integration`

See `docs/INTEGRATION.md` for full details. Requires `x-api-key` header,
never a session cookie.

| Method | Path | Notes |
|---|---|---|
| GET | `/products` | paginated, PUBLIC + non-ARCHIVED only |
| GET | `/products/:sku` | single product by SKU |
| GET | `/inventory` | lightweight SKU → stock/availability map |
| GET | `/categories` | active categories |

## Error format

```json
{ "error": "Human-readable message" }
```

Validation errors from Zod are joined into a single message string.

# DATABASE

Database name: `silk_warehouse` (dedicated to the warehouse — never shared
with a future selling-website database).

## Collections

| Collection | Purpose |
|---|---|
| `users` | Admin & Super Admin accounts |
| `sessions` | Active login sessions (TTL-indexed, auto-purged on expiry) |
| `otpverifications` | Phone/email OTP records (hashed codes only) |
| `products` | Warehouse inventory |
| `categories` | Open-ended product categories (not hardcoded) |
| `warehouses` | Warehouse locations (MAIN-WAREHOUSE seeded initially) |
| `paymentsettings` | Payment QR image reference |
| `auditlogs` | Append-only security/action audit trail |
| `integrationclients` | API keys issued to future integration consumers |

Note: the spec's originally-listed `product_images` collection is instead
embedded as a sub-document array (`Product.images`) — Cloudinary is the
actual image store; MongoDB only holds `secureUrl`/`publicId`/dimensions,
so a separate top-level collection added no value and would have required
an extra join on every product read.

## Key schema decisions

- **SKU** (`products.sku`): unique via a case-insensitive collation index
  (`{ locale: "en", strength: 2 }`), so `SAR-0001` and `sar-0001` collide.
  This is the stable business identifier the future website should key on.
- **Categories**: a real collection (`categories`), so new categories (e.g.
  `LEHENGA`) can be added via `POST /api/v1/warehouses/categories/all`
  without a code change.
- **Sessions**: only a hash of the opaque session token is stored
  (`tokenHash`), same principle as password hashing — a DB leak alone
  cannot be used to hijack sessions. TTL index auto-removes expired rows.
- **OTP**: only `codeHash` is stored (HMAC keyed by `OTP_SECRET`), never the
  raw code, with `attempts`/`maxAttempts`/`lockedUntil` for lockout.

## Indexes

| Collection | Index | Why |
|---|---|---|
| `products` | `{ sku: 1 }` unique, collation strength 2 | stable unique business ID |
| `products` | `{ category: 1 }` | category filter |
| `products` | `{ inventoryStatus: 1 }` | status filter |
| `products` | `{ publicVisibility: 1 }` | visibility filter |
| `products` | `{ warehouseId: 1 }` | per-warehouse queries |
| `products` | `{ createdAt: -1 }` | recency sort |
| `products` | `{ publicVisibility: 1, inventoryStatus: 1, category: 1 }` | compound — matches the integration API's real query pattern |
| `products` | text index on `name, fabric, color, sku` | dashboard search |
| `users` | `{ email: 1 }`, `{ phone: 1 }` unique | login lookup + uniqueness |
| `sessions` | `{ tokenHash: 1 }` unique, `{ expiresAt: 1 }` TTL | session lookup + auto-expiry |
| `warehouses`, `categories` | `{ code: 1 }` unique | stable codes |
| `auditlogs` | `{ actorUserId: 1, createdAt: -1 }`, `{ eventType: 1, createdAt: -1 }` | audit queries |

Additional compound indexes should be added as real query patterns emerge in
production (see PERFORMANCE section of the original spec) — avoid adding
indexes speculatively, since each one adds write overhead.

## Scaling notes

Designed for 1,000 → 50,000+ products via: pagination everywhere (never
`find({})` without `.limit()`), indexed `$text` search, server-side
filtering, and Cloudinary handling all image bytes/CDN delivery instead of
MongoDB.

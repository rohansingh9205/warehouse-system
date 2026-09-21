# INTEGRATION (for the future selling website)

This document is the contract between the warehouse and any future
selling website. It exists so that project can be built later, by a
different team or a different AI session, without needing to read the
warehouse's internal source code.

## The rule

```
Selling Website  --(x-api-key)-->  /api/v1/integration/*  -->  Warehouse Backend  -->  MongoDB
```

The selling website must **never**:
- connect to MongoDB directly
- receive MongoDB credentials
- receive raw MongoDB documents or internal field names
- use a Super Admin or Admin login/session to talk to the warehouse
- see admin information, audit logs, security data, internal cost fields,
  or private (non-`PUBLIC`) products

## Getting credentials

From the warehouse backend host, an operator runs:

```bash
npm run create-integration-client -- --name "selling-website-prod"
```

This prints a one-time API key (e.g. `wh_live_...`). Only its hash is
stored in the warehouse database — if the key is lost, issue a new one and
revoke the old client rather than trying to recover it.

The selling website sends this key on every request:

```
GET /api/v1/integration/products
x-api-key: wh_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## What's visible

Only products where `publicVisibility = PUBLIC` and
`inventoryStatus != ARCHIVED` are ever returned by `/integration/*` routes,
regardless of what filters are requested. A product can exist in the
warehouse and never appear here (e.g. `ACTIVE + PRIVATE`).

## Response shape (stable contract)

```json
{
  "sku": "SAR-0001",
  "name": "Banarasi Silk Saree",
  "category": "SAREE",
  "price": 5999,
  "availability": "IN_STOCK",
  "stockQuantity": 10,
  "description": "...",
  "fabric": "Banarasi Silk",
  "color": "Royal Blue",
  "design": "...",
  "size": "...",
  "images": [{ "url": "...", "width": 1200, "height": 1600, "isPrimary": true }],
  "updatedAt": "2026-09-20T10:00:00.000Z"
}
```

This shape is produced by `toPublicProductDto()` in
`src/modules/integration/product.dto.ts` — the single place internal
schema changes are translated into the stable public contract. If the
internal `Product` schema changes, this mapper is what gets updated; the
JSON shape above will not change without a `/api/v2` migration path.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/integration/products` | paginated product catalog (`page`, `pageSize`, `category`) |
| `GET /api/v1/integration/products/:sku` | single product by SKU (case-insensitive) |
| `GET /api/v1/integration/inventory` | lightweight `{ sku, stockQuantity, availability, updatedAt }[]` — for cart/stock re-checks without pulling full product data |
| `GET /api/v1/integration/categories` | active category list, so the website's category nav doesn't hardcode `SAREE`/`SILK_SUIT` either |

## Recommended integration pattern for the future website

1. Cache `/integration/products` and `/integration/categories` for its
   product listing pages (they change infrequently).
2. Before allowing checkout on a cart item, re-check `/integration/inventory`
   or `/integration/products/:sku` for current stock — don't trust a
   long-cached value for the final availability decision.
3. Never build a feature that requires a field not present in the DTO
   above. If one is genuinely needed, that's a warehouse-side change
   (extend `toPublicProductDto`), not something to work around by reaching
   into the warehouse database.

## Rate limits

`/integration/*` is rate-limited separately from admin traffic
(`INTEGRATION_RATE_LIMIT_PER_MIN`, default 60/min per the configured
limiter). Design the selling website to cache rather than poll these
endpoints on every page view.

## Versioning

`/api/v1/integration/*` will not have fields silently renamed or removed.
A breaking change means a new `/api/v2/integration/*` is introduced while
`/api/v1` keeps working, so the selling website can migrate on its own
schedule.

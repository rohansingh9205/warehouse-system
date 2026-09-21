# ARCHITECTURE

## Overview

The warehouse system is a standalone application with its own frontend,
backend, and database. It has no runtime dependency on any customer-facing
selling website.

```
WAREHOUSE FRONTEND (Next.js)
        |
        v  HTTPS + HTTP-only session cookie
WAREHOUSE BACKEND (Express + TypeScript)
        |
        v
WAREHOUSE MONGODB (silk_warehouse database)
```

Images:

```
WAREHOUSE FRONTEND -> WAREHOUSE BACKEND -> CLOUDINARY -> secureUrl/publicId -> MONGODB
```

Future selling website (not built yet, separate repository):

```
SELLING WEBSITE -> /api/v1/integration/* (x-api-key auth) -> WAREHOUSE BACKEND -> MONGODB
```

The selling website never receives MongoDB credentials, never sees internal
fields, and never authenticates as a warehouse admin.

## Independence guarantees

1. The warehouse backend, frontend and database can be started and used with
   zero selling-website code present.
2. All warehouse-only concerns (admin auth, RBAC, audit logs, inventory) live
   entirely inside `warehouse-backend`; nothing here imports or assumes a
   selling-website package.
3. The only door the future website may use is `/api/v1/integration/*`,
   authenticated with its own API key (`IntegrationClient`), never a Super
   Admin session.
4. Categories are data (`categories` collection), not a hardcoded enum, so
   new product lines can be added without a schema migration or redeploy.
5. Products use a stable, human-assigned SKU as the public business
   identifier; the future website is expected to key off `sku`, never
   MongoDB's `_id`.

## Module layout (backend)

```
src/modules/
  auth/          OTP, sessions, login/registration/password
  admin/         Admin/Super Admin user model + management routes
  products/      Product model, CRUD, search/filter/pagination
  categories/    Open-ended category list
  warehouses/    Warehouse model (MAIN-WAREHOUSE seeded by default)
  uploads/       Cloudinary signed upload/delete
  payment/       Payment QR (v1, display-only)
  audit/         Audit log model + read-only routes
  integration/   API-key-authenticated public DTO layer for the future website
```

## Why archiving instead of hard delete

Products are soft-deleted (`inventoryStatus = ARCHIVED`, `archivedAt`,
`archivedBy`) rather than removed from the database. This keeps historical
records intact and prevents ever breaking a future website integration that
may still reference an old SKU (e.g. in a customer's order history once that
system exists).

# Silk Warehouse Management System

A standalone warehouse & inventory management system for a Silk Suit & Saree
business. Built to run completely independently of any future customer-facing
selling website, which will connect later only through the versioned
integration API (see `docs/INTEGRATION.md`).

## Structure

```
/warehouse-system
  /warehouse-frontend   Next.js + TypeScript + Tailwind dashboard
  /warehouse-backend    Node.js + TypeScript + Express REST API
  /shared-types         Types shared between frontend and backend (optional)
  /docs                 Architecture, API, security, integration docs
  /scripts              Repo-level helper scripts
  /tests                Cross-cutting test notes
```

## Quick start (local development)

Prerequisites: Node.js 20+, a MongoDB Atlas cluster (or local MongoDB),
a Cloudinary account.

```bash
# 1. Backend
cd warehouse-backend
cp .env.example .env      # fill in real values
npm install
npm run seed:defaults     # creates MAIN-WAREHOUSE + SAREE/SILK_SUIT categories
npm run seed:super-admin -- --name "Owner" --phone "+91XXXXXXXXXX" --email owner@example.com
npm run dev                # http://localhost:4000

# 2. Frontend
cd ../warehouse-frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

Log in with the Super Admin credentials you set during `seed:super-admin`.
Additional Admin accounts self-register via the "Register as Admin" link
(name → phone OTP → email OTP → password).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture & independence guarantees
- [`docs/DATABASE.md`](docs/DATABASE.md) — collections, schema, indexes
- [`docs/API.md`](docs/API.md) — full API reference (`/api/v1`)
- [`docs/SECURITY.md`](docs/SECURITY.md) — auth, OTP, RBAC, rate limiting, threat mitigations
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment & backup/recovery
- [`docs/INTEGRATION.md`](docs/INTEGRATION.md) — exactly how the future selling website connects

## What this system deliberately does NOT include

Customer accounts, shopping cart, checkout, customer orders, reviews,
wishlist, coupons, delivery tracking. These belong to the future selling
website, a separate project that will consume this system only through
`/api/v1/integration/*`.

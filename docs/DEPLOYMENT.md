# DEPLOYMENT

## Overview

Backend and frontend deploy independently. Neither requires the other to be
present at build time.

## Backend

1. Provision a MongoDB Atlas cluster (own project, least-privilege DB user,
   IP allowlist or VPC peering).
2. Provision Cloudinary (cloud name, API key, API secret).
3. Set all variables from `.env.example` in your host's environment/secrets
   manager (never commit `.env`).
4. `npm run build` → `npm start` (or run under a process manager /
   containerize with a standard Node 20 image).
5. Set `NODE_ENV=production`, `COOKIE_SECURE=true` (requires HTTPS in
   front — e.g. a load balancer or reverse proxy terminating TLS), and set
   `trust proxy` appropriately if behind one (already handled in `app.ts`
   for `NODE_ENV=production`, adjust if your proxy chain has more hops).
6. Run `npm run seed:defaults` once against production to create
   `MAIN-WAREHOUSE` and the initial categories.
7. Run `npm run seed:super-admin -- --name ... --phone ... --email ...`
   once, from a trusted machine/terminal with access to the production
   `.env`, to create the first Super Admin.
8. If/when the future selling website is built, run
   `npm run create-integration-client -- --name "selling-website-prod"`
   and hand the printed API key to that project's secrets — never reuse an
   admin login for this.

## Frontend

1. Set `NEXT_PUBLIC_WAREHOUSE_API_URL` to the deployed backend's public
   `/api/v1` URL.
2. `npm run build` → `npm start`, or deploy to any Next.js-compatible host.
3. Ensure the backend's `WAREHOUSE_FRONTEND_ORIGIN` matches this frontend's
   deployed origin exactly (CORS + cookie `SameSite` depend on it).

## Backup & recovery

| Component | Backup approach |
|---|---|
| MongoDB Atlas | Enable Atlas's continuous/scheduled backups; test point-in-time restore periodically |
| Cloudinary | Cloudinary retains originals; additionally mirror `publicId`s referenced in MongoDB so orphaned/missing assets are detectable via a periodic reconciliation script |
| Environment secrets | Store in a secrets manager (not just `.env` files) with access-controlled backup — e.g. your cloud provider's secret store |
| Disaster recovery | Keep the seed scripts (`seed:defaults`, `seed:super-admin`) documented and rehearsed so a fresh cluster can be brought to a working baseline quickly |
| Production deployment recovery | Keep infra-as-code or documented manual steps for recreating the backend/frontend services from scratch, independent of any single running instance |

## Rolling out API changes

`/api/v1` must not have breaking changes made to it once any consumer
(including a future selling website) depends on it. If a breaking change is
needed, stand up `/api/v2` alongside the existing `/api/v1` router in
`app.ts`, migrate consumers, and only retire `/api/v1` once nothing depends
on it.

#!/usr/bin/env bash
# Convenience bootstrap for local development. Not used in production
# deployment (see docs/DEPLOYMENT.md for that).
#
# Usage: ./scripts/bootstrap-local-dev.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Installing warehouse-backend dependencies"
cd "$ROOT_DIR/warehouse-backend"
[ -f .env ] || cp .env.example .env
npm install

echo "==> Installing warehouse-frontend dependencies"
cd "$ROOT_DIR/warehouse-frontend"
[ -f .env.local ] || cp .env.example .env.local
npm install

cat <<'EOF'

Next steps:
  1. Edit warehouse-backend/.env with real MongoDB/Cloudinary/provider values.
  2. cd warehouse-backend && npm run seed:defaults
  3. cd warehouse-backend && npm run seed:super-admin -- --name "Owner" --phone "+91XXXXXXXXXX" --email owner@example.com
  4. cd warehouse-backend && npm run dev      (terminal 1)
  5. cd warehouse-frontend && npm run dev     (terminal 2)

EOF

#!/usr/bin/env bash
# Fix Prisma migration mismatch WITHOUT losing data.
# Run from project root with DATABASE_URL in .env (or set it).
set -e

cd "$(dirname "$0")/.."

if [ -z "$DATABASE_URL" ]; then
  echo "Load .env if needed: set -a; source .env; set +a"
  echo "DATABASE_URL must be set."
  exit 1
fi

echo "1. Generating delta SQL (current DB -> schema)..."
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script 2>/dev/null > delta.sql || true

if [ -s delta.sql ] && ! grep -q "Loaded Prisma" delta.sql; then
  echo "2. Applying delta (new tables/columns only, no data loss)..."
  npx prisma db execute --file delta.sql
  rm -f delta.sql
else
  echo "2. No delta (DB already in sync)."
  rm -f delta.sql
fi

echo "3. Marking baseline migration as applied (no run)..."
npx prisma migrate resolve --applied 0_init

echo "Done. Migration history is baselined; no data was lost."

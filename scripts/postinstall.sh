#!/bin/bash
# Postinstall script — runs after `npm install` / `bun install`
# Ensures the Prisma client is generated and ready for Vercel deployment.

set -e

cd "$(dirname "$0")/.."

echo "🔧 Generating Prisma client..."
bunx prisma generate 2>&1 | tail -3

echo "✅ Prisma client generated."
echo ""
echo "📝 Database configuration:"
echo "  - Development (local): SQLite file at db/custom.db"
echo "  - Production (Vercel): Turso cloud database (hardcoded in src/lib/db.ts)"
echo ""
echo "To push schema to Turso: bun run scripts/push-turso.ts"
echo "To seed Turso:           bun run scripts/seed-turso.ts"

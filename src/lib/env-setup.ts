// This file sets DATABASE_URL BEFORE Prisma is imported.
// It must be the first import in db.ts.
// The driver adapter handles the actual Turso connection, but
// Prisma's native query engine still validates the datasource URL at init.
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:/tmp/aura-prisma-dummy.db";

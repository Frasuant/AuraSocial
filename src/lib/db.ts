import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { existsSync, copyFileSync, mkdirSync } from "fs";
import path from "path";

/**
 * AuraMedia database.
 *
 * Production (Vercel): Uses Turso (libSQL) cloud database via Prisma driver adapter.
 *   The WASM query engine loads correctly under webpack (Vercel's bundler).
 *
 * Development (Turbopack): Uses a local SQLite file because Turbopack can't
 *   resolve the #wasm-engine-loader import that Prisma's WASM engine needs.
 *   The local SQLite is bootstrapped from db/seed.db on first run.
 *
 * ⚠️  Turso credentials are hardcoded per user request.
 */

// ── Hardcoded Turso credentials ──────────────────────────────────────────
const TURSO_URL = "libsql://auramedia-frasuant.aws-us-east-2.turso.io";
const TURSO_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU2ODg1NzYsImlkIjoiMDE5ZmJmNDEtYWMwMS03ZDg2LTgyY2EtN2MxNzEzNDdjMzlkIiwia2lkIjoiWjlkS0tyamx0SEw0NWxWM3AwdHVXUFIzXzM2NHI4bjB5dUVIcEEtWlRCYyIsInJpZCI6IjlkZTY3NzY3LWVlNzQtNDIyMS04MTNhLWYxMDZmNzAyNjhlZiJ9.nbbyyTWJKdDRKrLswlp80BtG1oc9g1oVW6v6GinKqV_qPhXEmq59HJvjSR6H7IgpYdfUkY0gHJQ37QFMFFD-DA";
// ──────────────────────────────────────────────────────────────────────────

// Use Turso in production, local SQLite in development.
// This is because Turbopack (dev) can't load Prisma's WASM query engine,
// which is required for driver adapters. Vercel (production) uses webpack
// which loads the WASM engine correctly.
const USE_TURSO = process.env.NODE_ENV === "production";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function bootstrapLocalSqlite(): string {
  const dbPath = path.join(process.cwd(), "db", "custom.db");
  const seedPath = path.join(process.cwd(), "db", "seed.db");

  if (!existsSync(dbPath) && existsSync(seedPath)) {
    try {
      mkdirSync(path.dirname(dbPath), { recursive: true });
      copyFileSync(seedPath, dbPath);
      console.log("[db] bootstrapped local SQLite from seed.db");
    } catch (e) {
      console.error("[db] bootstrap failed:", e);
    }
  }
  return `file:${dbPath}`;
}

function createPrismaClient(): PrismaClient {
  if (USE_TURSO) {
    // ── Production: Turso via driver adapter ──
    const libsql = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter } as any);
  }

  // ── Development: local SQLite file ──
  const sqliteUrl = bootstrapLocalSqlite();
  return new PrismaClient({
    datasourceUrl: sqliteUrl,
    log: ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

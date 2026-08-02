import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { existsSync, copyFileSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";

/**
 * AuraMedia database resolver.
 *
 * Supports three backends (auto-detected from DATABASE_URL):
 *  1. libSQL / Turso  (DATABASE_URL starts with "libsql://")  → persistent cloud DB (recommended for Vercel)
 *  2. SQLite file     (DATABASE_URL starts with "file:")       → local dev OR Vercel /tmp bootstrap
 *  3. Fallback        (no / unwritable)                        → /tmp/aura.db bootstrapped from bundled seed.db
 *
 * On serverless platforms (Vercel) the filesystem is read-only except /tmp, so we
 * copy the bundled `db/seed.db` to /tmp on cold start. This makes the app WORK
 * immediately (Admin login, demo posts). For real user signups that PERSIST across
 * cold starts, set DATABASE_URL to a Turso libSQL database (free tier, see Deploy Guide).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isWritableDir(dir: string): boolean {
  try {
    if (!existsSync(dir)) return false;
    // probe write
    const probe = path.join(dir, `.aura-writable-${Date.now()}`);
    writeFileSync(probe, "x");
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

/** Copy the bundled seed.db to the target path if the target doesn't exist. */
function bootstrapFromSeed(targetPath: string) {
  if (existsSync(targetPath)) return;
  const seedCandidates = [
    path.join(process.cwd(), "db", "seed.db"),
    path.join(process.cwd(), "prisma", "seed.db"),
  ];
  for (const seed of seedCandidates) {
    if (existsSync(seed) && seed !== targetPath) {
      try {
        mkdirSync(path.dirname(targetPath), { recursive: true });
        copyFileSync(seed, targetPath);
        console.log(`[db] bootstrapped ${targetPath} from bundled seed.db`);
        return;
      } catch (e) {
        console.error(`[db] bootstrap copy failed:`, e);
      }
    }
  }
}

function resolveSqliteUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith("file:")) {
    const filePath = envUrl.slice("file:".length);
    const dir = path.dirname(filePath);
    if (isWritableDir(dir)) {
      bootstrapFromSeed(filePath);
      return `file:${filePath}`;
    }
    // Configured path isn't writable (e.g. Vercel read-only FS) → fall through to /tmp
  }
  // Vercel / serverless fallback: /tmp is the only writable directory
  const tmpDir = "/tmp";
  if (existsSync(tmpDir)) {
    const tmpDb = path.join(tmpDir, "aura.db");
    bootstrapFromSeed(tmpDb);
    return `file:${tmpDb}`;
  }
  // Last resort
  return envUrl || "file:./db/custom.db";
}

function createPrismaClient(): PrismaClient {
  const envUrl = process.env.DATABASE_URL || "";

  // 1) Turso / libSQL cloud database (persistent, works on Vercel)
  if (envUrl.startsWith("libsql://") || envUrl.startsWith("https://")) {
    const token = process.env.LIBSQL_TOKEN || process.env.TURSO_AUTH_TOKEN || "";
    const libsql = createClient({ url: envUrl, authToken: token });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter } as any);
  }

  // 2) SQLite file (local dev or /tmp bootstrap on serverless)
  const sqliteUrl = resolveSqliteUrl();
  return new PrismaClient({
    datasourceUrl: sqliteUrl,
    log: ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

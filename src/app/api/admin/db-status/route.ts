import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const envUrl = process.env.DATABASE_URL || "";
    let backend: "turso" | "postgres" | "sqlite-file" | "sqlite-tmp" = "sqlite-tmp";
    let persistent = false;
    let note = "";

    if (envUrl.startsWith("libsql://") || envUrl.startsWith("https://")) {
      backend = "turso";
      persistent = true;
      note = "Turso cloud database — signups persist. Perfect for production.";
    } else if (envUrl.startsWith("postgresql://") || envUrl.startsWith("postgres://")) {
      backend = "postgres";
      persistent = true;
      note = "PostgreSQL — signups persist. Production-ready.";
    } else if (envUrl.startsWith("file:")) {
      // Determine if the path is writable/persistent
      backend = "sqlite-file";
      persistent = false;
      note =
        "SQLite file. Works locally, but on Vercel/serverless the filesystem is read-only and the app falls back to /tmp (ephemeral). Set up Turso for persistence.";
    } else {
      backend = "sqlite-tmp";
      persistent = false;
      note =
        "No DATABASE_URL set — running on ephemeral /tmp SQLite. Signups will NOT persist across cold starts. Set DATABASE_URL to a Turso libsql:// URL for production.";
    }

    return NextResponse.json({
      backend,
      persistent,
      note,
      databaseUrl: envUrl ? `${envUrl.slice(0, 40)}${envUrl.length > 40 ? "…" : ""}` : "(none — using /tmp fallback)",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

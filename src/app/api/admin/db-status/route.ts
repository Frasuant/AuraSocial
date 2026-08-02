import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    // The database is always Turso (hardcoded in src/lib/db.ts)
    return NextResponse.json({
      backend: "turso",
      persistent: true,
      note: "Turso cloud database — all data persists. Connected via Prisma driver adapter.",
      databaseUrl: "libsql://auramedia-frasuant.aws-us-east-2.turso.io",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

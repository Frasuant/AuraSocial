import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";

// Admin changes their own password (or any admin can change theirs).
export async function POST(req: Request) {
  try {
    const me = await requireAdmin();
    const body = await req.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "Both fields are required." }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });

    const ok = await verifyPassword(currentPassword, me.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({ where: { id: me.id }, data: { passwordHash } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

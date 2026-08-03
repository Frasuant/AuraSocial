import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin promotes a user to Moderator (or demotes back to regular user)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const userId = String(body.userId || "");
    const promote = Boolean(body.promote); // true = make moderator, false = remove moderator

    if (!userId)
      return NextResponse.json({ error: "userId required." }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, username: true, isAdmin: true, isModerator: true } });
    if (!user)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    if (user.isAdmin)
      return NextResponse.json({ error: "Cannot modify admin accounts." }, { status: 400 });

    const updated = await db.user.update({
      where: { id: userId },
      data: { isModerator: promote ? 1 : 0 },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        username: updated.username,
        isModerator: Boolean(updated.isModerator),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Record a profile view (when a logged-in user views someone else's profile)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ ok: true }); // anonymous views not tracked

    const { username } = await params;
    const target = await db.user.findUnique({ where: { username }, select: { id: true } });
    if (!target)
      return NextResponse.json({ ok: true });
    if (target.id === me.id)
      return NextResponse.json({ ok: true }); // don't track self-views

    // Upsert: if a view record exists, update the timestamp; otherwise create
    await db.profileView.upsert({
      where: {
        viewedId_viewerId: { viewedId: target.id, viewerId: me.id },
      },
      update: { createdAt: new Date() },
      create: { viewedId: target.id, viewerId: me.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

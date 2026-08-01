import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { username } = await params;
    const target = await db.user.findUnique({ where: { username } });
    if (!target)
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.id === me.id)
      return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId: me.id, followingId: target.id },
      },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    }

    await db.follow.create({
      data: { followerId: me.id, followingId: target.id },
    });

    // Notify the followed user
    await db.notification.create({
      data: {
        userId: target.id,
        actorId: me.id,
        type: "follow",
      },
    }).catch(() => {});

    return NextResponse.json({ following: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

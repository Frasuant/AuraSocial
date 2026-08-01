import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Block or unblock a user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { username } = await params;
    const target = await db.user.findUnique({ where: { username }, select: { id: true } });
    if (!target)
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.id === me.id)
      return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });

    const existing = await db.block.findUnique({
      where: { blockerId_blockedId: { blockerId: me.id, blockedId: target.id } },
    });

    if (existing) {
      // Unblock
      await db.block.delete({ where: { id: existing.id } });
      return NextResponse.json({ blocked: false });
    }

    // Block — also remove any existing follow relationship
    await db.$transaction([
      db.block.create({ data: { blockerId: me.id, blockedId: target.id } }),
      db.follow.deleteMany({
        where: {
          OR: [
            { followerId: me.id, followingId: target.id },
            { followerId: target.id, followingId: me.id },
          ],
        },
      }),
    ]);

    return NextResponse.json({ blocked: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

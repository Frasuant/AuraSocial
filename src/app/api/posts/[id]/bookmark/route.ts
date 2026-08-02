import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Toggle bookmark (save) on a post
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { id } = await params;
    const existing = await db.bookmark.findUnique({
      where: { postId_userId: { postId: id, userId: me.id } },
    });

    if (existing) {
      await db.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    }

    await db.bookmark.create({ data: { postId: id, userId: me.id } });
    return NextResponse.json({ bookmarked: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

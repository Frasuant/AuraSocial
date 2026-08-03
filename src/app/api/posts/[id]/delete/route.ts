import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Delete a post — only the author or an admin can delete.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { id } = await params;
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post)
      return NextResponse.json({ error: "Post not found." }, { status: 404 });

    if (post.authorId !== me.id && !me.isAdmin && !me.isModerator)
      return NextResponse.json({ error: "You can only delete your own posts." }, { status: 403 });

    await db.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

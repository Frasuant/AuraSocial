import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await db.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          avatarColor: true,
          isVerified: true,
          isAdmin: true,
        },
      },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in to comment." }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const content = String(body.content || "").trim();
    if (!content)
      return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
    if (content.length > 500)
      return NextResponse.json({ error: "Comment too long." }, { status: 400 });

    const comment = await db.comment.create({
      data: { postId: id, userId: me.id, content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            avatarColor: true,
            isVerified: true,
            isAdmin: true,
          },
        },
      },
    });

    // Notify the post author
    const post = await db.post.findUnique({ where: { id }, select: { authorId: true } });
    if (post && post.authorId !== me.id) {
      await db.notification.create({
        data: {
          userId: post.authorId,
          actorId: me.id,
          type: "comment",
          postId: id,
          content: content.slice(0, 120),
        },
      }).catch(() => {});
    }
    return NextResponse.json({ comment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

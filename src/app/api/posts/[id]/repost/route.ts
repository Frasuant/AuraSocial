import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

// Repost (re-share) a post — creates a new post by the user referencing the original.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in to repost." }, { status: 401 });

    const rl = rateLimit(req, { key: "repost", limit: 15, windowSec: 60 });
    if (rl.limited) return rl.response!;

    const { id } = await params;
    const original = await db.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true, caption: true, imageUrl: true, category: true },
    });
    if (!original)
      return NextResponse.json({ error: "Original post not found." }, { status: 404 });
    if (original.status !== "published")
      return NextResponse.json({ error: "Can't repost this." }, { status: 400 });
    if (original.authorId === me.id)
      return NextResponse.json({ error: "You can't repost your own post." }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const quote = String(body.quote || "").trim().slice(0, 500);

    // Check if already reposted (one repost per original per user)
    const existing = await db.post.findFirst({
      where: { authorId: me.id, repostOfId: id },
      select: { id: true },
    });
    if (existing)
      return NextResponse.json({ error: "You already reposted this.", repostId: existing.id }, { status: 409 });

    const repost = await db.post.create({
      data: {
        authorId: me.id,
        caption: quote || `Reposting @${original.caption.slice(0, 60)}`,
        category: original.category,
        imageUrl: "",
        status: "published", // reposts skip AI moderation (the original was already moderated)
        repostOfId: id,
      },
    });

    // Notify the original author
    await db.notification.create({
      data: {
        userId: original.authorId,
        actorId: me.id,
        type: "repost",
        postId: id,
        content: quote.slice(0, 120),
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, repostId: repost.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// Un-repost (delete the user's repost of a post)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { id } = await params;
    const repost = await db.post.findFirst({
      where: { authorId: me.id, repostOfId: id },
      select: { id: true },
    });
    if (!repost)
      return NextResponse.json({ error: "No repost to remove." }, { status: 404 });

    await db.post.delete({ where: { id: repost.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

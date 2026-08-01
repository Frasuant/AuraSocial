import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";

// Edit a post — only the author can edit. Re-runs AI moderation on the new caption.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const rl = rateLimit(req, { key: "edit", limit: 20, windowSec: 60 });
    if (rl.limited) return rl.response!;

    const { id } = await params;
    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });
    if (!post)
      return NextResponse.json({ error: "Post not found." }, { status: 404 });

    if (post.authorId !== me.id)
      return NextResponse.json({ error: "You can only edit your own posts." }, { status: 403 });

    const body = await req.json();
    const caption = String(body.caption || "").trim();
    const category = String(body.category || "flex");
    const imageUrl = String(body.imageUrl ?? "").trim();

    if (!caption)
      return NextResponse.json({ error: "Caption can't be empty." }, { status: 400 });
    if (caption.length > 2000)
      return NextResponse.json({ error: "Caption is too long (max 2000)." }, { status: 400 });

    // Re-run AI moderation on the edited caption
    const verdict = await moderateContent(caption, category);
    // If a previously-published post is edited and now flagged, hold it; if flagged→safe, re-publish
    let newStatus = post.status;
    if (!verdict.approved) {
      newStatus = "flagged";
    } else if (post.status === "flagged") {
      newStatus = "published";
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        caption,
        category,
        imageUrl,
        status: newStatus,
        moderationNote: verdict.note,
        moderationRisk: verdict.risk,
      },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({
      post: {
        id: updated.id,
        caption: updated.caption,
        imageUrl: updated.imageUrl,
        category: updated.category,
        status: updated.status,
        moderationNote: updated.moderationNote,
        moderationRisk: updated.moderationRisk,
        createdAt: updated.createdAt,
        author: updated.author,
        likeCount: updated._count.likes,
        commentCount: updated._count.comments,
        likedByMe: false,
      },
      moderation: verdict,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

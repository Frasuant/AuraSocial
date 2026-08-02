import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";

// Edit a post — only the author can edit. Supports caption, category, images, and publishing drafts.
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
    const isDraft = Boolean(body.draft);
    const publish = Boolean(body.publish);

    // Parse images array
    const imagesRaw = Array.isArray(body.images) ? body.images : [];
    const images = imagesRaw
      .map((s: any) => String(s || "").trim())
      .filter(Boolean)
      .slice(0, 6);
    const primaryImage = images.length > 0 ? images[0] : String(body.imageUrl ?? "").trim();

    // Drafts can have empty caption; published posts require one
    if (!isDraft && !caption)
      return NextResponse.json({ error: "Caption can't be empty." }, { status: 400 });
    if (caption.length > 2000)
      return NextResponse.json({ error: "Caption is too long (max 2000)." }, { status: 400 });

    let newStatus = post.status;
    let verdict = { approved: true, risk: 0, category: "safe", note: "", summary: "" };

    if (isDraft) {
      // Saving as draft — skip moderation
      newStatus = "draft";
    } else if (publish || post.status !== "draft") {
      // Publishing a draft OR editing a published post — run moderation
      verdict = await moderateContent(caption, category);
      if (!verdict.approved) {
        newStatus = "flagged";
      } else {
        newStatus = "published";
      }
    }

    const updated = await db.post.update({
      where: { id },
      data: {
        caption,
        category,
        imageUrl: primaryImage,
        images: JSON.stringify(images),
        status: newStatus,
        moderationNote: verdict.note,
        moderationRisk: verdict.risk,
      },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    // Parse images for response
    let responseImages: string[] = [];
    try {
      const parsed = JSON.parse(updated.images || "[]");
      if (Array.isArray(parsed)) responseImages = parsed.filter(Boolean);
    } catch {
      responseImages = [];
    }
    if (responseImages.length === 0 && updated.imageUrl) responseImages = [updated.imageUrl];

    return NextResponse.json({
      post: {
        id: updated.id,
        caption: updated.caption,
        imageUrl: updated.imageUrl,
        images: responseImages,
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

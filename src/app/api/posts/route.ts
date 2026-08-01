import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";

function formatPost(post: any, meId: string | null) {
  // Parse images JSON string; fall back to [imageUrl] for backward compat
  let images: string[] = [];
  try {
    const parsed = JSON.parse(post.images || "[]");
    if (Array.isArray(parsed)) images = parsed.filter(Boolean);
  } catch {
    images = [];
  }
  if (images.length === 0 && post.imageUrl) images = [post.imageUrl];

  return {
    id: post.id,
    caption: post.caption,
    imageUrl: post.imageUrl,
    images,
    category: post.category,
    status: post.status,
    moderationNote: post.moderationNote,
    moderationRisk: post.moderationRisk,
    createdAt: post.createdAt,
    author: post.author
      ? {
          id: post.author.id,
          username: post.author.username,
          avatarUrl: post.author.avatarUrl,
          avatarColor: post.author.avatarColor,
          isVerified: post.author.isVerified,
          isAdmin: post.author.isAdmin,
        }
      : null,
    likeCount: post._count?.likes ?? 0,
    commentCount: post._count?.comments ?? 0,
    likedByMe: meId
      ? (post.likes ?? []).some((l: any) => l.userId === meId)
      : false,
  };
}

export async function GET(req: Request) {
  const me = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const author = searchParams.get("author") || "";
  const status = searchParams.get("status") || "published";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(30, Number(searchParams.get("limit") || 15));

  const where: any = { status };
  if (category) where.category = category;
  if (author) where.author = { username: author };

  // For non-published statuses, require admin
  if (status !== "published" && (!me || !me.isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: me ? { where: { userId: me.id }, select: { userId: true } } : false,
    },
  });

  const hasMore = posts.length > limit;
  const items = (hasMore ? posts.slice(0, limit) : posts).map((p) =>
    formatPost(p, me?.id ?? null)
  );

  return NextResponse.json({
    posts: items,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in to post." }, { status: 401 });

    // Rate limit: 10 posts per minute per IP
    const rl = rateLimit(req, { key: "post", limit: 10, windowSec: 60 });
    if (rl.limited) return rl.response!;

    const body = await req.json();
    const caption = String(body.caption || "").trim();
    const category = String(body.category || "flex");
    const imageUrl = String(body.imageUrl || "").trim();
    const isDraft = Boolean(body.draft);
    // images: array of URLs (carousel). imageUrl is kept for backward compat (first image).
    const imagesRaw = Array.isArray(body.images) ? body.images : [];
    const images = imagesRaw
      .map((s: any) => String(s || "").trim())
      .filter(Boolean)
      .slice(0, 6); // max 6 images
    const primaryImage = imageUrl || (images.length > 0 ? images[0] : "");

    // Drafts can have empty caption; published posts require a caption
    if (!isDraft && !caption)
      return NextResponse.json({ error: "Write a caption first." }, { status: 400 });
    if (caption.length > 2000)
      return NextResponse.json({ error: "Caption is too long (max 2000)." }, { status: 400 });

    // Drafts skip AI moderation (will be moderated on publish)
    let status: string;
    let verdict = { approved: true, risk: 0, category: "safe", note: "", summary: "" };
    if (isDraft) {
      status = "draft";
    } else {
      verdict = await moderateContent(caption, category);
      status = verdict.approved ? "published" : "flagged";
    }

    const post = await db.post.create({
      data: {
        authorId: me.id,
        caption,
        category,
        imageUrl: primaryImage,
        images: JSON.stringify(images),
        status,
        moderationNote: verdict.note,
        moderationRisk: verdict.risk,
      },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({
      post: formatPost({ ...post, likes: [] }, me.id),
      moderation: verdict,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

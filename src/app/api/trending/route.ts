import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Trending posts — ranked by a popularity score:
// score = likes*3 + comments*2 + bookmarks*2, within the last 7 days.
// Falls back to all-time if not enough recent posts.
export async function GET() {
  try {
    const me = await getSessionUser();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await db.post.findMany({
      where: { status: "published", createdAt: { gte: sevenDaysAgo } },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            avatarColor: true,
            isVerified: true,
            isAdmin: true,
          },
        },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
        likes: me ? { where: { userId: me.id }, select: { userId: true } } : false,
        bookmarks: me ? { where: { userId: me.id }, select: { userId: true } } : false,
      },
    });

    const ranked = posts
      .map((p) => ({
        post: p,
        score:
          p._count.likes * 3 +
          p._count.comments * 2 +
          p._count.bookmarks * 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ post: p }) => ({
        id: p.id,
        caption: p.caption,
        imageUrl: p.imageUrl,
        category: p.category,
        status: p.status,
        moderationNote: p.moderationNote,
        moderationRisk: p.moderationRisk,
        createdAt: p.createdAt,
        author: p.author,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: me ? p.likes.length > 0 : false,
        bookmarkedByMe: me ? p.bookmarks.length > 0 : false,
      }));

    return NextResponse.json({ posts: ranked });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

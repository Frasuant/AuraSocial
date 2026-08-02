import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get posts bookmarked (saved) by the current user
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const bookmarks = await db.bookmark.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: {
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
            _count: { select: { likes: true, comments: true } },
            likes: { where: { userId: me.id }, select: { userId: true } },
          },
        },
      },
    });

    const posts = bookmarks
      .filter((b) => b.post && b.post.status === "published")
      .map((b) => ({
        id: b.post.id,
        caption: b.post.caption,
        imageUrl: b.post.imageUrl,
        category: b.post.category,
        status: b.post.status,
        moderationNote: b.post.moderationNote,
        moderationRisk: b.post.moderationRisk,
        createdAt: b.post.createdAt,
        author: b.post.author,
        likeCount: b.post._count.likes,
        commentCount: b.post._count.comments,
        likedByMe: b.post.likes.length > 0,
        bookmarkedAt: b.createdAt,
      }));

    return NextResponse.json({ posts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

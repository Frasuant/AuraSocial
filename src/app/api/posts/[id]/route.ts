import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get a single post with full detail (author, counts, liked/bookmarked by me, repost source)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const me = await getSessionUser();

    const post = await db.post.findUnique({
      where: { id },
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
        _count: { select: { likes: true, comments: true, bookmarks: true, reposts: true } },
        likes: me ? { where: { userId: me.id }, select: { userId: true } } : false,
        bookmarks: me ? { where: { userId: me.id }, select: { userId: true } } : false,
        repostOf: {
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
          },
        },
      },
    });

    if (!post)
      return NextResponse.json({ error: "Post not found." }, { status: 404 });

    // Parse images
    let images: string[] = [];
    try {
      const parsed = JSON.parse(post.images || "[]");
      if (Array.isArray(parsed)) images = parsed.filter(Boolean);
    } catch {
      images = [];
    }
    if (images.length === 0 && post.imageUrl) images = [post.imageUrl];

    return NextResponse.json({
      post: {
        id: post.id,
        caption: post.caption,
        imageUrl: post.imageUrl,
        images,
        category: post.category,
        status: post.status,
        moderationNote: post.moderationNote,
        moderationRisk: post.moderationRisk,
        createdAt: post.createdAt,
        author: post.author,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        bookmarkCount: post._count.bookmarks,
        repostCount: post._count.reposts,
        likedByMe: me ? post.likes.length > 0 : false,
        bookmarkedByMe: me ? post.bookmarks.length > 0 : false,
        repostOf: post.repostOf
          ? {
              id: post.repostOf.id,
              caption: post.repostOf.caption,
              imageUrl: post.repostOf.imageUrl,
              category: post.repostOf.category,
              createdAt: post.repostOf.createdAt,
              author: post.repostOf.author,
            }
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Discovery feed: posts from people you follow, plus posts liked by people you follow.
// Falls back to recent posts if the user follows no one.
export async function GET() {
  try {
    const me = await getSessionUser();

    if (!me) {
      // Not logged in — return recent published posts
      const posts = await db.post.findMany({
        where: { status: "published", repostOfId: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, avatarColor: true, isVerified: true, isAdmin: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
      return NextResponse.json({ posts: posts.map(formatPost) });
    }

    // Get IDs of people I follow
    const following = await db.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      // No follows — return recent posts from non-self users
      const posts = await db.post.findMany({
        where: { status: "published", repostOfId: null, authorId: { not: me.id } },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, avatarColor: true, isVerified: true, isAdmin: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId: me.id }, select: { userId: true } },
          bookmarks: { where: { userId: me.id }, select: { userId: true } },
        },
      });
      return NextResponse.json({ posts: posts.map((p) => formatPost(p, me.id)) });
    }

    // Posts authored by people I follow
    const [followedPosts, likedByFollowed] = await Promise.all([
      db.post.findMany({
        where: { status: "published", authorId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, avatarColor: true, isVerified: true, isAdmin: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId: me.id }, select: { userId: true } },
          bookmarks: { where: { userId: me.id }, select: { userId: true } },
        },
      }),
      // Posts liked (not authored) by people I follow — discovery signal
      db.like.findMany({
        where: { userId: { in: followingIds }, post: { status: "published", authorId: { not: me.id } } },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          post: {
            include: {
              author: { select: { id: true, username: true, avatarUrl: true, avatarColor: true, isVerified: true, isAdmin: true } },
              _count: { select: { likes: true, comments: true } },
              likes: { where: { userId: me.id }, select: { userId: true } },
              bookmarks: { where: { userId: me.id }, select: { userId: true } },
            },
          },
        },
      }),
    ]);

    // Merge, dedupe, and cap at 25
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const p of followedPosts) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }
    for (const l of likedByFollowed) {
      if (l.post && !seen.has(l.post.id)) {
        seen.add(l.post.id);
        merged.push(l.post);
      }
    }

    return NextResponse.json({ posts: merged.slice(0, 25).map((p) => formatPost(p, me.id)) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

function formatPost(p: any, meId?: string) {
  return {
    id: p.id,
    caption: p.caption,
    imageUrl: p.imageUrl,
    category: p.category,
    status: p.status,
    moderationNote: p.moderationNote || "",
    moderationRisk: p.moderationRisk || 0,
    createdAt: p.createdAt,
    author: p.author,
    likeCount: p._count?.likes ?? 0,
    commentCount: p._count?.comments ?? 0,
    likedByMe: meId ? (p.likes ?? []).length > 0 : false,
    bookmarkedByMe: meId ? (p.bookmarks ?? []).length > 0 : false,
  };
}

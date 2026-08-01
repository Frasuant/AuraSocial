import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Search posts by caption (hashtag-style or plain text) and users by username
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 1)
      return NextResponse.json({ posts: [], users: [] });

    // Support hashtag syntax: #fitness → search caption containing "fitness"
    const query = q.startsWith("#") ? q.slice(1) : q;

    const [posts, users] = await Promise.all([
      db.post.findMany({
        where: {
          status: "published",
          caption: { contains: query },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
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
        },
      }),
      db.user.findMany({
        where: {
          OR: [
            { username: { contains: query } },
            { bio: { contains: query } },
          ],
        },
        take: 10,
        select: {
          id: true,
          username: true,
          bio: true,
          avatarUrl: true,
          avatarColor: true,
          isVerified: true,
          isAdmin: true,
          _count: { select: { followers: true, posts: true } },
        },
      }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        caption: p.caption,
        imageUrl: p.imageUrl,
        category: p.category,
        createdAt: p.createdAt,
        author: p.author,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
      })),
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor,
        isVerified: u.isVerified,
        isAdmin: u.isAdmin,
        followerCount: u._count.followers,
        postCount: u._count.posts,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

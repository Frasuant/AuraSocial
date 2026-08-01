import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const me = await getSessionUser();

  const user = await db.user.findUnique({
    where: { username },
    include: {
      posts: {
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true, comments: true } } },
      },
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found." }, { status: 404 });

  const isFollowing = me
    ? !!(await db.follow.findUnique({
        where: {
          followerId_followingId: { followerId: me.id, followingId: user.id },
        },
      }))
    : false;

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isMe: me?.id === user.id,
    },
    posts: user.posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl,
      category: p.category,
      createdAt: p.createdAt,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
    })),
  });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Discover users to follow
export async function GET() {
  const me = await getSessionUser();
  const followingIds = me
    ? (await db.follow.findMany({ where: { followerId: me.id }, select: { followingId: true } })).map((f) => f.followingId)
    : [];

  const users = await db.user.findMany({
    where: {
      AND: [
        me ? { id: { not: me.id } } : {},
        { id: { notIn: followingIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 12,
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
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      followerCount: u._count.followers,
      postCount: u._count.posts,
      _count: undefined,
    })),
  });
}

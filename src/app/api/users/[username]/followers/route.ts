import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// List followers of a user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      followers: {
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          createdAt: true,
          follower: {
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
          },
        },
      },
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({
    users: user.followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      bio: f.follower.bio,
      avatarUrl: f.follower.avatarUrl,
      avatarColor: f.follower.avatarColor,
      isVerified: f.follower.isVerified,
      isAdmin: f.follower.isAdmin,
      followerCount: f.follower._count.followers,
      postCount: f.follower._count.posts,
      followedAt: f.createdAt,
    })),
  });
}

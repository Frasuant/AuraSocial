import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// List who a user is following
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      following: {
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          createdAt: true,
          following: {
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
    users: user.following.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      bio: f.following.bio,
      avatarUrl: f.following.avatarUrl,
      avatarColor: f.following.avatarColor,
      isVerified: f.following.isVerified,
      isAdmin: f.following.isAdmin,
      followerCount: f.following._count.followers,
      postCount: f.following._count.posts,
      followedAt: f.createdAt,
    })),
  });
}

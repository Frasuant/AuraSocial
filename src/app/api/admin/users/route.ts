import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        avatarColor: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: { posts: true, followers: true, following: true },
        },
      },
    });
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor,
        isVerified: u.isVerified,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        postCount: u._count.posts,
        followerCount: u._count.followers,
        followingCount: u._count.following,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

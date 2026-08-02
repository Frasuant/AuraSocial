import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Suggested users to follow — verified users + users with most followers
// that the current user doesn't already follow.
export async function GET() {
  try {
    const me = await getSessionUser();

    const followingIds = me
      ? (await db.follow.findMany({
          where: { followerId: me.id },
          select: { followingId: true },
        })).map((f) => f.followingId)
      : [];

    const excludeIds = me ? [me.id, ...followingIds] : [];

    // Get verified users first (capped), then most-followed users
    const [verified, popular] = await Promise.all([
      excludeIds.length > 0
        ? db.user.findMany({
            where: { id: { notIn: excludeIds }, isVerified: true },
            take: 3,
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
          })
        : db.user.findMany({
            where: { isVerified: true },
            take: 3,
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
      db.user.findMany({
        where: excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {},
        orderBy: { createdAt: "desc" },
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

    // Merge, dedupe by id, prefer verified first, cap at 5
    const seen = new Set<string>();
    const merged = [];
    for (const u of [...verified, ...popular]) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        merged.push(u);
      }
      if (merged.length >= 5) break;
    }

    return NextResponse.json({
      users: merged.map((u) => ({
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

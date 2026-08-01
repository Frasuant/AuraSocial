import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get who viewed the current user's profile (most recent first)
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const views = await db.profileView.findMany({
      where: { viewedId: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        viewer: {
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
    });

    const totalCount = await db.profileView.count({ where: { viewedId: me.id } });

    return NextResponse.json({
      totalViews: totalCount,
      viewers: views.map((v) => ({
        id: v.viewer.id,
        username: v.viewer.username,
        bio: v.viewer.bio,
        avatarUrl: v.viewer.avatarUrl,
        avatarColor: v.viewer.avatarColor,
        isVerified: v.viewer.isVerified,
        isAdmin: v.viewer.isAdmin,
        followerCount: v.viewer._count.followers,
        postCount: v.viewer._count.posts,
        viewedAt: v.createdAt,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

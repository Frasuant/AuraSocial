import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get the current user's draft posts (only visible to the author)
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const drafts = await db.post.findMany({
      where: { authorId: me.id, status: "draft" },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    });

    const posts = drafts.map((p) => {
      let images: string[] = [];
      try {
        const parsed = JSON.parse(p.images || "[]");
        if (Array.isArray(parsed)) images = parsed.filter(Boolean);
      } catch {
        images = [];
      }
      if (images.length === 0 && p.imageUrl) images = [p.imageUrl];

      return {
        id: p.id,
        caption: p.caption,
        imageUrl: p.imageUrl,
        images,
        category: p.category,
        status: p.status,
        moderationNote: p.moderationNote,
        moderationRisk: p.moderationRisk,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        author: {
          id: me.id,
          username: me.username,
          avatarUrl: me.avatarUrl,
          avatarColor: me.avatarColor,
          isVerified: me.isVerified,
          isAdmin: me.isAdmin,
        },
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: false,
      };
    });

    return NextResponse.json({ posts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

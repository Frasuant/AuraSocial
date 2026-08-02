import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// List posts for admin moderation queue
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "flagged";

    const posts = await db.post.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: 100,
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
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        caption: p.caption,
        imageUrl: p.imageUrl,
        category: p.category,
        status: p.status,
        moderationNote: p.moderationNote,
        moderationRisk: p.moderationRisk,
        createdAt: p.createdAt,
        author: p.author,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

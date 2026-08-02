import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// List community-reported posts for admin review
export async function GET() {
  try {
    await requireAdmin();
    const reports = await db.report.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        post: {
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
          },
        },
        reporter: {
          select: { id: true, username: true, avatarColor: true },
        },
      },
    });

    // group by post
    const byPost = new Map<string, any>();
    for (const r of reports) {
      if (!byPost.has(r.postId)) {
        byPost.set(r.postId, {
          post: {
            id: r.post.id,
            caption: r.post.caption,
            imageUrl: r.post.imageUrl,
            category: r.post.category,
            status: r.post.status,
            moderationRisk: r.post.moderationRisk,
            createdAt: r.post.createdAt,
            author: r.post.author,
          },
          reportCount: 0,
          reasons: {},
          reporters: [],
        });
      }
      const entry = byPost.get(r.postId);
      entry.reportCount += 1;
      entry.reasons[r.reason] = (entry.reasons[r.reason] || 0) + 1;
      entry.reporters.push({ username: r.reporter.username, reason: r.reason, at: r.createdAt });
    }

    return NextResponse.json({
      reports: Array.from(byPost.values()).sort((a, b) => b.reportCount - a.reportCount),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

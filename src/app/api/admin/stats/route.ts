import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [userCount, postCount, flaggedCount, verifiedCount] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.post.count({ where: { status: "flagged" } }),
      db.user.count({ where: { isVerified: true } }),
    ]);
    const recentFlags = await db.post.findMany({
      where: { status: "flagged" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        author: { select: { username: true, avatarColor: true, isVerified: true } },
      },
    });
    return NextResponse.json({
      stats: {
        userCount,
        postCount,
        flaggedCount,
        verifiedCount,
      },
      recentFlags: recentFlags.map((p) => ({
        id: p.id,
        caption: p.caption.slice(0, 120),
        category: p.category,
        risk: p.moderationRisk,
        note: p.moderationNote,
        createdAt: p.createdAt,
        author: p.author,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

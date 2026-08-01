import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const REASONS = ["spam", "scam", "harassment", "hate", "explicit", "illegal", "other"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in to report." }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const reason = String(body.reason || "").trim();
    if (!REASONS.includes(reason))
      return NextResponse.json({ error: "Pick a valid reason." }, { status: 400 });

    const post = await db.post.findUnique({ where: { id } });
    if (!post)
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (post.authorId === me.id)
      return NextResponse.json({ error: "You can't report your own post." }, { status: 400 });

    // idempotent: if already reported, just acknowledge
    const existing = await db.report.findUnique({
      where: { postId_reporterId: { postId: id, reporterId: me.id } },
    });
    if (existing)
      return NextResponse.json({ reported: true, already: true });

    await db.report.create({
      data: { postId: id, reporterId: me.id, reason },
    });

    // Auto-escalate: if 3+ open reports, flag the post for admin review
    const openReports = await db.report.count({ where: { postId: id, status: "open" } });
    if (openReports >= 3 && post.status === "published") {
      await db.post.update({
        where: { id },
        data: {
          status: "flagged",
          moderationNote: `Community reports: ${openReports} users flagged this (${reason}).`,
          moderationRisk: Math.min(100, 50 + openReports * 10),
        },
      });
    }

    return NextResponse.json({ reported: true, openReports });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

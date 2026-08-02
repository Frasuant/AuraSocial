import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get posts that reposted this post (who shared it)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reposts = await db.post.findMany({
      where: { repostOfId: id, status: "published" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        caption: true,
        createdAt: true,
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
    });

    return NextResponse.json({
      reposts: reposts.map((r) => ({
        id: r.id,
        caption: r.caption,
        createdAt: r.createdAt,
        author: r.author,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

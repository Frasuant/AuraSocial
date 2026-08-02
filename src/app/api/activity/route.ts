import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get the current user's recent activity (likes, comments, reposts they've made)
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const [likes, comments, reposts] = await Promise.all([
      // Likes the user has made
      db.like.findMany({
        where: { userId: me.id, post: { status: "published" } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              caption: true,
              category: true,
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
          },
        },
      }),
      // Comments the user has made
      db.comment.findMany({
        where: { userId: me.id, post: { status: "published" } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              caption: true,
              category: true,
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
          },
        },
      }),
      // Reposts the user has made
      db.post.findMany({
        where: { authorId: me.id, repostOfId: { not: null }, status: "published" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          caption: true,
          createdAt: true,
          repostOf: {
            select: {
              id: true,
              caption: true,
              category: true,
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
          },
        },
      }),
    ]);

    // Merge into a single timeline sorted by date
    type ActivityItem = {
      id: string;
      type: "like" | "comment" | "repost";
      createdAt: string;
      content?: string;
      post: {
        id: string;
        caption: string;
        category: string;
        createdAt: string;
        author: any;
      };
      repostOf?: any;
    };

    const items: ActivityItem[] = [
      ...likes.map((l) => ({
        id: l.id,
        type: "like" as const,
        createdAt: l.createdAt,
        post: l.post,
      })),
      ...comments.map((c) => ({
        id: c.id,
        type: "comment" as const,
        createdAt: c.createdAt,
        content: c.content,
        post: c.post,
      })),
      ...reposts.map((r) => ({
        id: r.id,
        type: "repost" as const,
        createdAt: r.createdAt,
        content: r.caption,
        post: r.repostOf
          ? {
              id: r.repostOf.id,
              caption: r.repostOf.caption,
              category: r.repostOf.category,
              createdAt: r.repostOf.createdAt,
              author: r.repostOf.author,
            }
          : null as any,
        repostOf: r.repostOf,
      })),
    ].filter((i) => i.post);

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activity: items.slice(0, 50) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

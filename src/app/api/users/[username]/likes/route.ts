import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get posts liked by a user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const me = await getSessionUser();

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      likes: {
        where: { post: { status: "published" } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          createdAt: true,
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
              _count: { select: { likes: true, comments: true } },
              likes: me ? { where: { userId: me.id }, select: { userId: true } } : false,
              bookmarks: me ? { where: { userId: me.id }, select: { userId: true } } : false,
            },
          },
        },
      },
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found." }, { status: 404 });

  const posts = user.likes.map((l) => ({
    id: l.post.id,
    caption: l.post.caption,
    imageUrl: l.post.imageUrl,
    category: l.post.category,
    status: l.post.status,
    moderationNote: l.post.moderationNote,
    moderationRisk: l.post.moderationRisk,
    createdAt: l.post.createdAt,
    author: l.post.author,
    likeCount: l.post._count.likes,
    commentCount: l.post._count.comments,
    likedByMe: me ? l.post.likes.length > 0 : false,
    bookmarkedByMe: me ? l.post.bookmarks.length > 0 : false,
    likedAt: l.createdAt,
  }));

  return NextResponse.json({ posts });
}

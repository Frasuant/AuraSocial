import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Get notifications for the current user (likes, comments, follows received)
export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const notifications = await db.notification.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: {
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

    const unreadCount = await db.notification.count({
      where: { userId: me.id, read: false },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        postId: n.postId,
        content: n.content,
        read: n.read,
        createdAt: n.createdAt,
        actor: n.actor,
      })),
      unreadCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

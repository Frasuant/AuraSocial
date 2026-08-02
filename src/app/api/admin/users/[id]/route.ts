import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin deletes a user account.
// All their posts, likes, comments, follows, etc. are automatically deleted
// via Prisma's onDelete: Cascade on all relations pointing to User.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAdmin();
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, username: true, isAdmin: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Prevent admin from deleting themselves or other admins
    if (user.id === me.id)
      return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
    if (user.isAdmin)
      return NextResponse.json({ error: "You can't delete other admin accounts." }, { status: 403 });

    // Delete the user — cascades to posts, likes, comments, follows,
    // notifications, reports, bookmarks, profile views, and blocks.
    await db.user.delete({ where: { id } });

    return NextResponse.json({ ok: true, deletedUsername: user.username });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

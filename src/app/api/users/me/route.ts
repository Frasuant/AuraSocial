import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, sanitizeUser } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/constants";

// Update the current user's profile (bio + avatar color + avatar image)
export async function PATCH(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const body = await req.json();
    const data: any = {};

    if (typeof body.bio === "string") {
      const bio = body.bio.slice(0, 200);
      data.bio = bio;
    }
    if (typeof body.avatarColor === "string" && AVATAR_COLORS.includes(body.avatarColor as any)) {
      data.avatarColor = body.avatarColor;
    }
    if (typeof body.avatarUrl === "string") {
      data.avatarUrl = body.avatarUrl;
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

    const updated = await db.user.update({
      where: { id: me.id },
      data,
    });
    return NextResponse.json({ user: sanitizeUser(updated) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

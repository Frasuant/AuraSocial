import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const userId = String(body.userId || "");
    const verified = Boolean(body.verified);
    if (!userId)
      return NextResponse.json({ error: "userId required." }, { status: 400 });

    const user = await db.user.update({
      where: { id: userId },
      data: { isVerified: verified },
      select: {
        id: true,
        username: true,
        isVerified: true,
      },
    });
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

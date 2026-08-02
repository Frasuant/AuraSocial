import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, getSessionUser, hashPassword } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 signups per minute per IP
    const rl = rateLimit(req, { key: "register", limit: 5, windowSec: 60 });
    if (rl.limited) return rl.response!;

    const body = await req.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !email || !password)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    if (username.length < 3 || username.length > 20)
      return NextResponse.json({ error: "Username must be 3–20 characters." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return NextResponse.json({ error: "Username: letters, numbers, underscores only." }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const existing = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing)
      return NextResponse.json({ error: "Username or email already taken." }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const user = await db.user.create({
      data: { username, email, passwordHash, avatarColor, bio: "" },
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ?? null });
}

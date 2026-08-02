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
    const username = String(body.username || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !email || !password)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    // Username validation (like Instagram/X):
    // - 3 to 35 characters
    // - Only lowercase letters, numbers, periods (.), and underscores (_)
    // - Must contain at least one letter
    // - No consecutive periods
    // - Cannot start or end with a period
    // - Cannot contain "www"
    if (username.length < 3 || username.length > 35)
      return NextResponse.json({ error: "Username must be 3–35 characters long." }, { status: 400 });
    if (!/^[a-z0-9._]+$/.test(username))
      return NextResponse.json({ error: "Username can only use lowercase letters, numbers, periods, and underscores." }, { status: 400 });
    if (!/[a-z]/.test(username))
      return NextResponse.json({ error: "Username must contain at least one letter." }, { status: 400 });
    if (username.includes(".."))
      return NextResponse.json({ error: "Username cannot contain consecutive periods." }, { status: 400 });
    if (username.startsWith(".") || username.endsWith("."))
      return NextResponse.json({ error: "Username cannot start or end with a period." }, { status: 400 });
    if (username.includes("www"))
      return NextResponse.json({ error: "Username cannot contain 'www'." }, { status: 400 });

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

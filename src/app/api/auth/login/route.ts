import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password)
      return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });

    const user = await db.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
    });
    if (!user)
      return NextResponse.json({ error: "No account found with those credentials." }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok)
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

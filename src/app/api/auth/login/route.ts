import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: Request) {
  try {
    // Rate limit: 10 login attempts per minute per IP
    const rl = rateLimit(req, { key: "login", limit: 10, windowSec: 60 });
    if (rl.limited) return rl.response!;

    const body = await req.json();
    const identifier = String(body.identifier || "").trim().toLowerCase();
    const password = String(body.password || "");
    const recaptchaToken = String(body.recaptchaToken || "");

    if (!identifier || !password)
      return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });

    // Verify reCAPTCHA
    const recaptchaOk = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaOk)
      return NextResponse.json({ error: "reCAPTCHA verification failed. Please try again." }, { status: 403 });

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

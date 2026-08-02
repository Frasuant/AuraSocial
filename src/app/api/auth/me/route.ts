import { NextResponse } from "next/server";
import { getSessionUser, sanitizeUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: sanitizeUser(user) });
}

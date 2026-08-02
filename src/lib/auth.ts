import bcrypt from "bcryptjs";
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// User type (replaces Prisma's generated type)
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string;
  avatarUrl: string;
  avatarColor: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SESSION_COOKIE = "aura_session";
const SECRET = process.env.AURA_SECRET || "auramedia-dev-secret-change-me";

// HMAC-signed token: userId.timestamp.signature
function sign(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 3) return null;
  const sig = parts.pop()!;
  const payload = parts.join(".");
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  // constant-time compare
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return null;
  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const userId = payload.split(".")[0];
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (!user.isAdmin) throw new Error("Admin only");
  return user;
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    avatarColor: user.avatarColor,
    isVerified: user.isVerified,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

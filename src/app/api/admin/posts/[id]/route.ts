import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const status = String(body.status || "");
    if (!["published", "flagged", "removed", "approved"].includes(status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });

    const post = await db.post.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ post });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

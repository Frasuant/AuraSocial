import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { moderateImage } from "@/lib/moderation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const me = await getSessionUser();
    if (!me)
      return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });

    // Image moderation
    const imgCheck = moderateImage(file.name, file.size, file.type);
    if (!imgCheck.approved)
      return NextResponse.json({ error: imgCheck.reason }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    const safeExt = allowed.includes(ext) ? ext : "jpg";
    const name = `${randomUUID()}.${safeExt}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

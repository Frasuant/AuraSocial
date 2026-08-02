import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { moderateImage } from "@/lib/moderation";

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

    // Convert file to base64 data URL — no filesystem needed (works on Vercel)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

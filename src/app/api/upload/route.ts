import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { moderateImage, analyzeImageContent } from "@/lib/moderation";
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

    // Basic image moderation (file type, size, filename)
    const imgCheck = moderateImage(file.name, file.size, file.type);
    if (!imgCheck.approved)
      return NextResponse.json({ error: imgCheck.reason }, { status: 400 });

    // Get the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // NSFW image content analysis (skin tone detection + heuristic checks)
    const contentCheck = await analyzeImageContent(buffer, file.type);
    if (!contentCheck.approved) {
      return NextResponse.json({ error: contentCheck.reason }, { status: 400 });
    }

    // Convert to base64 data URL
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      moderation: { risk: contentCheck.risk, note: contentCheck.note },
    });
  } catch (e: any) {
    console.error("[upload] error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

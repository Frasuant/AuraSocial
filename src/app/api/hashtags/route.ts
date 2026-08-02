import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Autocomplete hashtags: extract hashtags from all published post captions,
// count frequency, return top matches for a prefix.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    // Fetch all published post captions (cap for performance)
    const posts = await db.post.findMany({
      where: { status: "published" },
      select: { caption: true },
      take: 1000,
    });

    // Extract all #hashtags
    const counts = new Map<string, number>();
    for (const p of posts) {
      const matches = p.caption.matchAll(/#([a-zA-Z0-9_]+)/g);
      for (const m of matches) {
        const tag = m[1].toLowerCase();
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    let tags = Array.from(counts.entries()).map(([tag, count]) => ({ tag, count }));

    // Filter by prefix if provided
    if (q) {
      // allow searching with or without leading #
      const prefix = q.startsWith("#") ? q.slice(1) : q;
      tags = tags.filter((t) => t.tag.startsWith(prefix.toLowerCase()));
    }

    // Sort by count desc, then alphabetical, take top 10
    tags.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    tags = tags.slice(0, 10);

    return NextResponse.json({ tags });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

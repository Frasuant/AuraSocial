import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Admin resets/wipes website data. Selective: choose what to delete.
// Body: { posts, comments, likes, follows, bookmarks, notifications, reports, blocks, profileViews, allExceptAdmin }
// Each flag is a boolean. If allExceptAdmin is true, wipes EVERYTHING except the Admin account.
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const results: string[] = [];

    // If "allExceptAdmin" — wipe everything but keep the Admin user
    if (body.allExceptAdmin) {
      const tables = [
        "Block",
        "ProfileView",
        "Bookmark",
        "Report",
        "Notification",
        "Follow",
        "Comment",
        "Like",
        "Post",
      ];
      for (const table of tables) {
        try {
          await db.$executeRaw(`DELETE FROM "${table}"`);
          results.push(`✓ Cleared ${table}`);
        } catch (e: any) {
          results.push(`⊘ ${table}: ${e.message?.slice(0, 50)}`);
        }
      }
      // Delete all non-admin users
      try {
        await db.$executeRaw(`DELETE FROM "User" WHERE "isAdmin" = 0`);
        results.push("✓ Cleared all non-admin users");
      } catch (e: any) {
        results.push(`⊘ Users: ${e.message?.slice(0, 50)}`);
      }
      return NextResponse.json({ ok: true, results });
    }

    // Selective wipe
    const wipes: { flag: boolean; table: string; label: string }[] = [
      { flag: body.posts, table: "Post", label: "Posts" },
      { flag: body.comments, table: "Comment", label: "Comments" },
      { flag: body.likes, table: "Like", label: "Likes" },
      { flag: body.follows, table: "Follow", label: "Follows" },
      { flag: body.bookmarks, table: "Bookmark", label: "Bookmarks" },
      { flag: body.notifications, table: "Notification", label: "Notifications" },
      { flag: body.reports, table: "Report", label: "Reports" },
      { flag: body.blocks, table: "Block", label: "Blocks" },
      { flag: body.profileViews, table: "ProfileView", label: "Profile Views" },
      { flag: body.users, table: "User", label: "Users (non-admin)" },
    ];

    for (const { flag, table, label } of wipes) {
      if (!flag) continue;
      try {
        if (table === "User") {
          // Don't delete admin accounts
          await db.$executeRaw(`DELETE FROM "User" WHERE "isAdmin" = 0`);
        } else if (table === "Post") {
          // Posts have dependent records — delete those first
          await db.$executeRaw(`DELETE FROM "Like"`);
          await db.$executeRaw(`DELETE FROM "Comment"`);
          await db.$executeRaw(`DELETE FROM "Bookmark"`);
          await db.$executeRaw(`DELETE FROM "Report"`);
          await db.$executeRaw(`DELETE FROM "Post"`);
          results.push("✓ Cleared Posts (and their likes, comments, bookmarks, reports)");
          continue;
        } else {
          await db.$executeRaw(`DELETE FROM "${table}"`);
        }
        results.push(`✓ Cleared ${label}`);
      } catch (e: any) {
        results.push(`⊘ ${label}: ${e.message?.slice(0, 50)}`);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 403 });
  }
}

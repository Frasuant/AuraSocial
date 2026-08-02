import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const TURSO_URL = "libsql://auramedia-frasuant.aws-us-east-2.turso.io";
const TURSO_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU2ODg1NzYsImlkIjoiMDE5ZmJmNDEtYWMwMS03ZDg2LTgyY2EtN2MxNzEzNDdjMzlkIiwia2lkIjoiWjlkS0tyamx0SEw0NWxWM3AwdHVXUFIzXzM2NHI4bjB5dUVIcEEtWlRCYyIsInJpZCI6IjlkZTY3NzY3LWVlNzQtNDIyMS04MTNhLWYxMDZmNzAyNjhlZiJ9.nbbyyTWJKdDRKrLswlp80BtG1oc9g1oVW6v6GinKqV_qPhXEmq59HJvjSR6H7IgpYdfUkY0gHJQ37QFMFFD-DA";

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

function cuid() {
  return "c" + randomUUID().replace(/-/g, "").slice(0, 24);
}

async function wipeAndReseed() {
  console.log("=== Wiping ALL data from Turso ===\n");

  // Delete in dependency order (children first, parents last)
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
    "User",
  ];

  for (const table of tables) {
    try {
      await client.execute(`DELETE FROM "${table}"`);
      console.log(`  ✓ Cleared ${table}`);
    } catch (e: any) {
      console.log(`  ⊘ ${table}: ${e.message?.slice(0, 60)}`);
    }
  }

  console.log("\n=== Creating fresh Admin account ===\n");

  const now = new Date().toISOString();
  const adminId = cuid();
  const adminPw = await bcrypt.hash("Admin123", 10);

  await client.execute({
    sql: `INSERT INTO User (id, username, email, passwordHash, bio, avatarUrl, avatarColor, isVerified, isAdmin, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      adminId,
      "Admin",
      "admin@auramedia.app",
      adminPw,
      "Founder of AuraMedia. Flex your grind. 🔥",
      "",
      "violet",
      1, // isVerified
      1, // isAdmin
      now,
      now,
    ],
  });

  console.log("  ✓ Admin account created");
  console.log("    Username: Admin");
  console.log("    Password: Admin123");
  console.log("    ID:", adminId);

  // Verify
  const count = await client.execute("SELECT COUNT(*) as cnt FROM User");
  const postCount = await client.execute("SELECT COUNT(*) as cnt FROM Post");
  console.log("\n=== Final state ===");
  console.log("  Users:", (count.rows[0] as any).cnt);
  console.log("  Posts:", (postCount.rows[0] as any).cnt);
  console.log("\n✅ Database is fresh. Only Admin exists. No demo users, no old posts.");

  process.exit(0);
}

wipeAndReseed().catch((e) => {
  console.error(e);
  process.exit(1);
});

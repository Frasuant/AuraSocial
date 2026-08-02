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

async function seed() {
  const now = new Date().toISOString();

  // Check if Admin already exists
  const existing = await client.execute("SELECT id FROM User WHERE username = 'Admin'");
  if (existing.rows.length > 0) {
    console.log("Admin already exists, skipping seed.");
    process.exit(0);
  }

  const adminPw = await bcrypt.hash("Admin123", 10);
  const adminId = cuid();
  await client.execute({
    sql: `INSERT INTO User (id, username, email, passwordHash, bio, avatarUrl, avatarColor, isVerified, isAdmin, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [adminId, "Admin", "admin@auramedia.app", adminPw, "The founder of AuraMedia. Set the standard. Flex the grind. 🏆", "", "violet", 1, 1, now, now],
  });
  console.log("✓ Admin user created");

  // Demo users
  const demos = [
    { username: "MarcoFlex", email: "marco@aura.app", bio: "Sold my first SaaS for 7 figures. Sharing the journey. 🚀", color: "rose" },
    { username: "LunaDrives", email: "luna@aura.app", bio: "Car collector. Just added the GT3 to the garage. 🏎️", color: "amber" },
    { username: "KaiEarnings", email: "kai@aura.app", bio: "YouTube 1.2M subs. Monthly earning reports inside. 💰", color: "emerald" },
  ];

  const demoIds: { id: string; username: string }[] = [];
  for (const d of demos) {
    const id = cuid();
    const pw = await bcrypt.hash("password123", 10);
    await client.execute({
      sql: `INSERT INTO User (id, username, email, passwordHash, bio, avatarUrl, avatarColor, isVerified, isAdmin, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, d.username, d.email, pw, d.bio, "", d.color, 0, 0, now, now],
    });
    demoIds.push({ id, username: d.username });
    console.log(`✓ ${d.username} created`);
  }

  // Demo posts
  const posts = [
    { author: demoIds[0], caption: "Closed the SaaS exit today. 3 years of 80-hour weeks finally paid off. The goal wasn't money — it was freedom. Next stop: a month off in the Alps. ⛰️", category: "business" },
    { author: demoIds[1], caption: "New member of the family: Porsche 911 GT3. Manual, of course. Goal since I was 12. Don't let anyone tell you dreams are too big. 🏁", category: "car" },
    { author: demoIds[2], caption: "October YouTube earnings just hit: $84,250. Started this channel 2 years ago with 0 subscribers. Consistency is the only cheat code. 📈", category: "earnings" },
    { author: demoIds[0], caption: "Q4 goal: run a sub-4 marathon AND ship 2 new products. Discipline > motivation. Who's locking in with me?", category: "goal" },
  ];

  for (const p of posts) {
    const id = cuid();
    await client.execute({
      sql: `INSERT INTO Post (id, authorId, caption, imageUrl, images, category, status, moderationNote, moderationRisk, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, p.author.id, p.caption, "", "[]", p.category, "published", "", 0, now, now],
    });
    console.log(`✓ Post by ${p.author.username}: ${p.caption.slice(0, 40)}...`);
  }

  console.log("\nSeed complete! Admin login: Admin / Admin123");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

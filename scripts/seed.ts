import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function seed() {
  const passwordHash = await bcrypt.hash("Admin123", 10);

  const admin = await db.user.upsert({
    where: { username: "Admin" },
    update: {},
    create: {
      username: "Admin",
      email: "admin@auramedia.app",
      passwordHash,
      bio: "The founder of AuraMedia. Set the standard. Flex the grind. 🏆",
      avatarColor: "violet",
      isVerified: true,
      isAdmin: true,
    },
  });

  // Seed a few demo users so the feed isn't empty
  const demos = [
    {
      username: "MarcoFlex",
      email: "marco@aura.app",
      bio: "Sold my first SaaS for 7 figures. Sharing the journey. 🚀",
      avatarColor: "rose",
    },
    {
      username: "LunaDrives",
      email: "luna@aura.app",
      bio: "Car collector. Just added the GT3 to the garage. 🏎️",
      avatarColor: "amber",
    },
    {
      username: "KaiEarnings",
      email: "kai@aura.app",
      bio: "YouTube 1.2M subs. Monthly earning reports inside. 💰",
      avatarColor: "emerald",
    },
  ];

  const created: { id: string; username: string }[] = [];
  for (const d of demos) {
    const u = await db.user.upsert({
      where: { username: d.username },
      update: {},
      create: {
        ...d,
        passwordHash: await bcrypt.hash("password123", 10),
        isVerified: false,
      },
    });
    created.push(u);
  }

  // Seed demo posts
  const posts = [
    {
      author: created[0],
      caption:
        "Closed the SaaS exit today. 3 years of 80-hour weeks finally paid off. The goal wasn't money — it was freedom. Next stop: a month off in the Alps. ⛰️",
      category: "business",
    },
    {
      author: created[1],
      caption:
        "New member of the family: Porsche 911 GT3. Manual, of course. Goal since I was 12. Don't let anyone tell you dreams are too big. 🏁",
      category: "car",
    },
    {
      author: created[2],
      caption:
        "October YouTube earnings just hit: $84,250. Started this channel 2 years ago with 0 subscribers. Consistency is the only cheat code. 📈",
      category: "earnings",
    },
    {
      author: created[0],
      caption:
        "Q4 goal: run a sub-4 marathon AND ship 2 new products. Discipline > motivation. Who's locking in with me?",
      category: "goal",
    },
  ];

  for (const p of posts) {
    const existing = await db.post.findFirst({
      where: { authorId: p.author.id, caption: p.caption },
    });
    if (!existing) {
      await db.post.create({
        data: {
          authorId: p.author.id,
          caption: p.caption,
          category: p.category,
          status: "published",
        },
      });
    }
  }

  console.log("Seed complete. Admin:", admin.username, admin.id);
  console.log("Demo users:", created.map((c) => c.username).join(", "));
  await db.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

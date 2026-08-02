import { createClient, type Client } from "@libsql/client";

/**
 * AuraMedia database — Turso (libSQL) cloud database.
 * Prisma-compatible wrapper backed by @libsql/client.
 * No Prisma engine needed — works on Bun, Node, Vercel, everywhere.
 *
 * ⚠️  Turso credentials are hardcoded per user request.
 */

const TURSO_URL = "libsql://auramedia-frasuant.aws-us-east-2.turso.io";
const TURSO_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU2ODg1NzYsImlkIjoiMDE5ZmJmNDEtYWMwMS03ZDg2LTgyY2EtN2MxNzEzNDdjMzlkIiwia2lkIjoiWjlkS0tyamx0SEw0NWxWM3AwdHVXUFIzXzM2NHI4bjB5dUVIcEEtWlRCYyIsInJpZCI6IjlkZTY3NzY3LWVlNzQtNDIyMS04MTNhLWYxMDZmNzAyNjhlZiJ9.nbbyyTWJKdDRKrLswlp80BtG1oc9g1oVW6v6GinKqV_qPhXEmq59HJvjSR6H7IgpYdfUkY0gHJQ37QFMFFD-DA";

const client: Client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// ── Relation definitions ─────────────────────────────────────────────────
interface Relation {
  type: "belongsTo" | "hasMany";
  model: string;
  foreignKey: string; // column on this table (belongsTo) or remote table (hasMany)
  localKey?: string; // column on this table for hasMany
}

const RELATIONS: Record<string, Record<string, Relation>> = {
  Post: {
    author: { type: "belongsTo", model: "User", foreignKey: "authorId" },
    likes: { type: "hasMany", model: "Like", foreignKey: "postId", localKey: "id" },
    comments: { type: "hasMany", model: "Comment", foreignKey: "postId", localKey: "id" },
    reports: { type: "hasMany", model: "Report", foreignKey: "postId", localKey: "id" },
    bookmarks: { type: "hasMany", model: "Bookmark", foreignKey: "postId", localKey: "id" },
    repostOf: { type: "belongsTo", model: "Post", foreignKey: "repostOfId" },
    reposts: { type: "hasMany", model: "Post", foreignKey: "repostOfId", localKey: "id" },
  },
  User: {
    posts: { type: "hasMany", model: "Post", foreignKey: "authorId", localKey: "id" },
    likes: { type: "hasMany", model: "Like", foreignKey: "userId", localKey: "id" },
    comments: { type: "hasMany", model: "Comment", foreignKey: "userId", localKey: "id" },
    bookmarks: { type: "hasMany", model: "Bookmark", foreignKey: "userId", localKey: "id" },
    following: { type: "hasMany", model: "Follow", foreignKey: "followerId", localKey: "id" },
    followers: { type: "hasMany", model: "Follow", foreignKey: "followingId", localKey: "id" },
    notifications: { type: "hasMany", model: "Notification", foreignKey: "userId", localKey: "id" },
    sentNotifications: { type: "hasMany", model: "Notification", foreignKey: "actorId", localKey: "id" },
    reports: { type: "hasMany", model: "Report", foreignKey: "reporterId", localKey: "id" },
    profileViews: { type: "hasMany", model: "ProfileView", foreignKey: "viewedId", localKey: "id" },
    viewedProfiles: { type: "hasMany", model: "ProfileView", foreignKey: "viewerId", localKey: "id" },
    blocking: { type: "hasMany", model: "Block", foreignKey: "blockerId", localKey: "id" },
    blockedBy: { type: "hasMany", model: "Block", foreignKey: "blockedId", localKey: "id" },
  },
  Like: {
    post: { type: "belongsTo", model: "Post", foreignKey: "postId" },
    user: { type: "belongsTo", model: "User", foreignKey: "userId" },
  },
  Comment: {
    post: { type: "belongsTo", model: "Post", foreignKey: "postId" },
    user: { type: "belongsTo", model: "User", foreignKey: "userId" },
  },
  Follow: {
    follower: { type: "belongsTo", model: "User", foreignKey: "followerId" },
    following: { type: "belongsTo", model: "User", foreignKey: "followingId" },
  },
  Notification: {
    user: { type: "belongsTo", model: "User", foreignKey: "userId" },
    actor: { type: "belongsTo", model: "User", foreignKey: "actorId" },
  },
  Report: {
    post: { type: "belongsTo", model: "Post", foreignKey: "postId" },
    reporter: { type: "belongsTo", model: "User", foreignKey: "reporterId" },
  },
  Bookmark: {
    post: { type: "belongsTo", model: "Post", foreignKey: "postId" },
    user: { type: "belongsTo", model: "User", foreignKey: "userId" },
  },
  ProfileView: {
    viewed: { type: "belongsTo", model: "User", foreignKey: "viewedId" },
    viewer: { type: "belongsTo", model: "User", foreignKey: "viewerId" },
  },
  Block: {
    blocker: { type: "belongsTo", model: "User", foreignKey: "blockerId" },
    blocked: { type: "belongsTo", model: "User", foreignKey: "blockedId" },
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────

function buildWhere(where: any): { sql: string; args: any[] } {
  if (!where || Object.keys(where).length === 0) return { sql: "", args: [] };
  const parts: string[] = [];
  const args: any[] = [];

  for (const [key, val] of Object.entries(where)) {
    // Compound unique keys (e.g., postId_userId)
    if (key.includes("_") && val && typeof val === "object" && !Array.isArray(val)) {
      for (const [subKey, subVal] of Object.entries(val as object)) {
        parts.push(`"${subKey}" = ?`);
        args.push(subVal);
      }
      continue;
    }

    if (key === "OR") {
      const orParts: string[] = [];
      for (const cond of val as any[]) {
        const sub = buildWhere(cond);
        if (sub.sql) {
          orParts.push(`(${sub.sql})`);
          args.push(...sub.args);
        }
      }
      if (orParts.length) parts.push(`(${orParts.join(" OR ")})`);
      continue;
    }

    if (key === "AND") {
      for (const cond of val as any[]) {
        const sub = buildWhere(cond);
        if (sub.sql) {
          parts.push(`(${sub.sql})`);
          args.push(...sub.args);
        }
      }
      continue;
    }

    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      for (const [op, opVal] of Object.entries(val)) {
        if (op === "contains") {
          parts.push(`"${key}" LIKE ?`);
          args.push(`%${opVal}%`);
        } else if (op === "startsWith") {
          parts.push(`"${key}" LIKE ?`);
          args.push(`${opVal}%`);
        } else if (op === "gte") {
          parts.push(`"${key}" >= ?`);
          args.push(opVal);
        } else if (op === "lte") {
          parts.push(`"${key}" <= ?`);
          args.push(opVal);
        } else if (op === "gt") {
          parts.push(`"${key}" > ?`);
          args.push(opVal);
        } else if (op === "lt") {
          parts.push(`"${key}" < ?`);
          args.push(opVal);
        } else if (op === "not") {
          parts.push(`"${key}" != ?`);
          args.push(opVal);
        } else if (op === "in") {
          const arr = opVal as any[];
          if (arr.length > 0) {
            const ph = arr.map(() => "?").join(",");
            parts.push(`"${key}" IN (${ph})`);
            args.push(...arr);
          } else {
            parts.push("0"); // empty IN = false
          }
        }
      }
    } else {
      parts.push(`"${key}" = ?`);
      args.push(val);
    }
  }

  return { sql: parts.join(" AND "), args };
}

function buildOrderBy(orderBy: any): string {
  if (!orderBy) return "";
  if (typeof orderBy === "string") return `ORDER BY "${orderBy}" DESC`;
  const parts: string[] = [];
  for (const [key, dir] of Object.entries(orderBy)) {
    parts.push(`"${key}" ${String(dir).toUpperCase()}`);
  }
  return parts.length ? `ORDER BY ${parts.join(", ")}` : "";
}

function parseRow(row: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
      try {
        result[key] = JSON.parse(val);
      } catch {
        result[key] = val;
      }
    } else {
      result[key] = val;
    }
  }
  return result;
}

function serializeVal(val: any): any {
  if (typeof val === "object" && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
    return JSON.stringify(val);
  }
  return val;
}

// ── Include resolver ─────────────────────────────────────────────────────

async function resolveIncludes(
  tableName: string,
  rows: Record<string, any>[],
  include: any
): Promise<void> {
  if (!include || rows.length === 0) return;
  const relations = RELATIONS[tableName];
  if (!relations) return;

  for (const [relName, relConfig] of Object.entries(include)) {
    if (relName === "_count") {
      // Handle _count
      const countSelect = (relConfig as any)?.select;
      if (countSelect) {
        for (const row of rows) {
          (row as any)._count = {};
          for (const countRelName of Object.keys(countSelect)) {
            const rel = relations[countRelName];
            if (rel && rel.type === "hasMany") {
              const r = await client.execute({
                sql: `SELECT COUNT(*) as cnt FROM "${rel.model}" WHERE "${rel.foreignKey}" = ?`,
                args: [row[rel.localKey!]],
              });
              (row as any)._count[countRelName] = Number((r.rows[0] as any)?.cnt ?? 0);
            }
          }
        }
      }
      continue;
    }

    const rel = relations[relName];
    if (!rel) continue;

    const relInclude = (relConfig as any)?.include;
    const relSelect = (relConfig as any)?.select;
    const relWhere = (relConfig as any)?.where;

    if (rel.type === "belongsTo") {
      // Fetch the related record for each row
      const ids = [...new Set(rows.map((r) => r[rel.foreignKey]).filter(Boolean))];
      if (ids.length === 0) continue;
      const placeholders = ids.map(() => "?").join(",");
      const result = await client.execute({
        sql: `SELECT * FROM "${rel.model}" WHERE "id" IN (${placeholders})`,
        args: ids,
      });
      const relMap = new Map(result.rows.map((r) => [(r as any).id, parseRow(r as any)]));

      for (const row of rows) {
        const relRow = relMap.get(row[rel.foreignKey]);
        if (relRow) {
          // Apply select if specified
          if (relSelect) {
            const selected: any = {};
            for (const key of Object.keys(relSelect)) {
              if (relSelect[key]) selected[key] = (relRow as any)[key];
            }
            (row as any)[relName] = selected;
          } else {
            (row as any)[relName] = relRow;
          }
          // Recursively resolve nested includes
          if (relInclude) {
            await resolveIncludes(rel.model, [relRow], relInclude);
          }
        } else {
          (row as any)[relName] = null;
        }
      }
    } else {
      // hasMany — fetch related records for each row
      for (const row of rows) {
        let sql = `SELECT * FROM "${rel.model}" WHERE "${rel.foreignKey}" = ?`;
        const args: any[] = [row[rel.localKey!]];

        if (relWhere) {
          const w = buildWhere(relWhere);
          if (w.sql) {
            sql += ` AND (${w.sql})`;
            args.push(...w.args);
          }
        }

        if (relSelect) {
          // If only userId is selected (for likedByMe/bookmarkedByMe checks)
          const selectKeys = Object.keys(relSelect).filter((k) => relSelect[k]);
          if (selectKeys.length === 1 && selectKeys[0] === "userId") {
            const result = await client.execute({ sql, args });
            (row as any)[relName] = result.rows.map((r) => ({ userId: (r as any).userId }));
          } else {
            const result = await client.execute({ sql, args });
            (row as any)[relName] = result.rows.map((r) => parseRow(r as any));
          }
        } else {
          const result = await client.execute({ sql, args });
          (row as any)[relName] = result.rows.map((r) => parseRow(r as any));
        }
      }
    }
  }
}

// ── Model factory ────────────────────────────────────────────────────────

// Merge _count from select into include for resolution
function mergeCountFromSelect(include: any, select: any): any {
  if (!select) return include;
  const countInSelect = (select as any)?._count;
  if (!countInSelect) return include;
  const merged = { ...(include || {}), _count: countInSelect };
  return merged;
}

function createModel(tableName: string) {
  return {
    async findUnique(opts: { where: any; select?: any; include?: any }) {
      const w = buildWhere(opts.where);
      if (!w.sql) return null;
      const sql = `SELECT * FROM "${tableName}" WHERE ${w.sql} LIMIT 1`;
      const result = await client.execute({ sql, args: w.args });
      if (result.rows.length === 0) return null;
      const row = parseRow(result.rows[0] as any);
      const inc = mergeCountFromSelect(opts.include, opts.select);
      if (inc) await resolveIncludes(tableName, [row], inc);
      return row;
    },

    async findFirst(opts: { where?: any; orderBy?: any; select?: any; include?: any }) {
      const w = buildWhere(opts.where);
      const ob = buildOrderBy(opts.orderBy);
      const whereClause = w.sql ? `WHERE ${w.sql}` : "";
      const sql = `SELECT * FROM "${tableName}" ${whereClause} ${ob} LIMIT 1`.trim();
      const result = await client.execute({ sql, args: w.args });
      if (result.rows.length === 0) return null;
      const row = parseRow(result.rows[0] as any);
      const inc = mergeCountFromSelect(opts.include, opts.select);
      if (inc) await resolveIncludes(tableName, [row], inc);
      return row;
    },

    async findMany(opts: {
      where?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
      select?: any;
      include?: any;
      cursor?: any;
    } = {}) {
      const w = buildWhere(opts.where);
      const ob = buildOrderBy(opts.orderBy);
      const whereClause = w.sql ? `WHERE ${w.sql}` : "";
      let limitClause = "";
      if (opts.take !== undefined) limitClause = `LIMIT ${opts.take}`;
      let skipClause = "";
      if (opts.skip) skipClause = `OFFSET ${opts.skip}`;
      const sql = `SELECT * FROM "${tableName}" ${whereClause} ${ob} ${limitClause} ${skipClause}`.trim().replace(/\s+/g, " ");
      const result = await client.execute({ sql, args: w.args });
      const rows = result.rows.map((r) => parseRow(r as any));
      const inc = mergeCountFromSelect(opts.include, opts.select);
      if (inc && rows.length > 0) await resolveIncludes(tableName, rows, inc);
      return rows;
    },

    async create(opts: { data: any; include?: any; select?: any }) {
      const keys = Object.keys(opts.data);
      const values = Object.values(opts.data).map(serializeVal);
      const placeholders = keys.map(() => "?").join(", ");
      const cols = keys.map((k) => `"${k}"`).join(", ");
      const sql = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`;
      const result = await client.execute({ sql, args: values });
      if (result.rows.length === 0) return null;
      const row = parseRow(result.rows[0] as any);
      const inc = mergeCountFromSelect(opts.include, opts.select);
      if (inc) await resolveIncludes(tableName, [row], inc);
      return row;
    },

    async update(opts: { where: any; data: any; include?: any; select?: any }) {
      const w = buildWhere(opts.where);
      if (!w.sql) throw new Error("update requires a where clause");
      const sets: string[] = [];
      const args: any[] = [];
      for (const [key, val] of Object.entries(opts.data)) {
        sets.push(`"${key}" = ?`);
        args.push(serializeVal(val));
      }
      args.push(...w.args);
      const sql = `UPDATE "${tableName}" SET ${sets.join(", ")} WHERE ${w.sql} RETURNING *`;
      const result = await client.execute({ sql, args });
      if (result.rows.length === 0) return null;
      const row = parseRow(result.rows[0] as any);
      const inc = mergeCountFromSelect(opts.include, opts.select);
      if (inc) await resolveIncludes(tableName, [row], inc);
      return row;
    },

    async upsert(opts: { where: any; create: any; update: any; include?: any }) {
      const existing = await this.findUnique({ where: opts.where });
      if (existing) {
        return this.update({ where: opts.where, data: opts.update, include: opts.include });
      }
      return this.create({ data: opts.create, include: opts.include });
    },

    async delete(opts: { where: any; include?: any }) {
      const w = buildWhere(opts.where);
      if (!w.sql) throw new Error("delete requires a where clause");
      const sql = `DELETE FROM "${tableName}" WHERE ${w.sql} RETURNING *`;
      const result = await client.execute({ sql, args: w.args });
      if (result.rows.length === 0) return null;
      return parseRow(result.rows[0] as any);
    },

    async deleteMany(opts: { where?: any } = {}) {
      const w = buildWhere(opts.where);
      const whereClause = w.sql ? `WHERE ${w.sql}` : "";
      const sql = `DELETE FROM "${tableName}" ${whereClause}`.trim();
      await client.execute({ sql, args: w.args });
      return { count: 0 };
    },

    async updateMany(opts: { where?: any; data: any }) {
      const w = buildWhere(opts.where);
      const sets: string[] = [];
      const args: any[] = [];
      for (const [key, val] of Object.entries(opts.data)) {
        sets.push(`"${key}" = ?`);
        args.push(serializeVal(val));
      }
      args.push(...w.args);
      const whereClause = w.sql ? `WHERE ${w.sql}` : "";
      const sql = `UPDATE "${tableName}" SET ${sets.join(", ")} ${whereClause}`.trim();
      await client.execute({ sql, args });
      return { count: 0 };
    },

    async count(opts: { where?: any } = {}) {
      const w = buildWhere(opts.where);
      const whereClause = w.sql ? `WHERE ${w.sql}` : "";
      const sql = `SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`.trim();
      const result = await client.execute({ sql, args: w.args });
      return Number((result.rows[0] as any)?.count ?? 0);
    },
  };
}

// ── Export ───────────────────────────────────────────────────────────────

export const db = {
  user: createModel("User"),
  post: createModel("Post"),
  like: createModel("Like"),
  comment: createModel("Comment"),
  follow: createModel("Follow"),
  notification: createModel("Notification"),
  report: createModel("Report"),
  bookmark: createModel("Bookmark"),
  profileView: createModel("ProfileView"),
  block: createModel("Block"),

  async $transaction(promises: Promise<any>[]) {
    return Promise.all(promises);
  },

  $queryRaw: async (sql: string, args: any[] = []) => {
    const result = await client.execute({ sql, args });
    return result.rows;
  },

  $executeRaw: async (sql: string, args: any[] = []) => {
    await client.execute({ sql, args });
  },

  async $disconnect() {
    client.close();
  },
};

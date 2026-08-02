import type { NextConfig } from "next";

// Set DATABASE_URL BEFORE anything else — Prisma's native query engine
// validates this at init time even when a driver adapter is used.
// The adapter handles the actual Turso connection; this is just to satisfy
// the query engine's URL validation.
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:/tmp/aura-prisma-dummy.db";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

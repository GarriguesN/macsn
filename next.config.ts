import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backend API with persistent SQLite. NO static export.
  output: undefined,
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;

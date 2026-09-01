import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backend API con SQLite persistente. NO static export.
  output: undefined,
  serverExternalPackages: ["better-sqlite3"],
  // Permitir imágenes remotas para el mockup (Unsplash placeholders).
  // Cuando los assets reales vivan en /public, esto se puede eliminar.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
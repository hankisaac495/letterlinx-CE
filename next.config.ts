import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets tests build a second copy (e.g. with Supabase settings) without clobbering .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

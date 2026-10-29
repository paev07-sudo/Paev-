import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds plain HTML/CSS/JS into `out/` (no Node.js server
 * needed), e.g. for GitHub Pages. NEXT_PUBLIC_BASE_PATH serves the site from
 * a sub-path such as "/Paev-".
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(staticExport && { output: "export", trailingSlash: true, images: { unoptimized: true } }),
  basePath,
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

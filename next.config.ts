import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma uses Node/WASM at runtime; do not bundle it into Server Components / Route Handlers.
  // sharp ships native libvips binaries; keep it external and force-trace them into the thumbnail
  // serverless function so Vercel does not 500 with ERR_DLOPEN_FAILED after sharp 0.35+.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "sharp"],
  outputFileTracingIncludes: {
    "/files/[fileId]/thumbnail": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-*/**/*",
      "./node_modules/@img/sharp-libvips-linux-*/**/*",
    ],
  },
  async redirects() {
    return [
      { source: "/blog-md", destination: "/docs", permanent: true },
      { source: "/blog-md/:slug*", destination: "/docs/:slug*", permanent: true },
      { source: "/md-posts", destination: "/md-docs", permanent: true },
      { source: "/md-posts/:rest*", destination: "/md-docs/:rest*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;

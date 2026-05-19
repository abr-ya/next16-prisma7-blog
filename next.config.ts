import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma uses Node/WASM at runtime; do not bundle it into Server Components / Route Handlers.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
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
    ],
  },
};

export default nextConfig;

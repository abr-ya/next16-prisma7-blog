import { Suspense } from "react";
import type { Metadata } from "next";

import { AboutSection, HeroSection } from "@/components/index";
// Do not barrel-export RecentDocuments / DB-backed home segments: any client
// import from this file would pull Prisma/pg into the browser bundle.
import { RecentDocuments } from "@/components/home-page/recent-docs";
import { RecentDocumentsFallback } from "@/components/home-page/recent-docs-fallback";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Home",
  description: "Personal blog, docs, videos, and notes built with Next.js 16 and Prisma 7.",
  path: "/",
});

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AboutSection />
      <Suspense fallback={<RecentDocumentsFallback />}>
        <RecentDocuments />
      </Suspense>
    </main>
  );
}

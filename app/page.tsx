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
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <AboutSection className="px-0 py-0" />
        <Suspense fallback={<RecentDocumentsFallback className="px-0 py-0" />}>
          <RecentDocuments className="px-0 py-0" />
        </Suspense>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { AboutSection, HeroSection } from "@/components/index";
// Do not barrel-export RecentDocuments / DB-backed home segments: any client
// import from this file would pull Prisma/pg into the browser bundle.
import { RecentDocuments } from "@/components/home-page/recent-docs";
import { RecentDocumentsFallback } from "@/components/home-page/recent-docs-fallback";

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

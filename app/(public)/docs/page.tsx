import type { Metadata } from "next";

import { getLatestMdDocs } from "@/app/_data/getMdDocs";
import { DocsList } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import type { MdDoc } from "@/generated/prisma/client";
import { getMdDocsLoadErrorMessage } from "@/lib/prisma-md-docs-load-error-message";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Docs",
  description: "Markdown docs, notes, and technical writeups from the public library.",
  path: "/docs",
});

const DocsPage = async () => {
  let docs: MdDoc[] = [];
  let loadError: string | null = null;

  try {
    docs = await getLatestMdDocs(10);
  } catch (error) {
    console.error("[DocsPage] Failed to load md docs:", error);
    loadError = getMdDocsLoadErrorMessage(error);
  }

  return (
    <PageLayout title="Markdown Blog Page" className="pt-6" showBackLink={false}>
      <DocsList docs={docs} loadError={loadError} />
    </PageLayout>
  );
};

export default DocsPage;

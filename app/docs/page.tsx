import type { MdDoc } from "@/generated/prisma/client";
import { PageLayout } from "@/components/layout/page-layout";
import { DocsList } from "@/components/index";
import { getMdDocsLoadErrorMessage } from "@/lib/prisma-md-docs-load-error-message";
import { getLatestMdDocs } from "../_data/getMdDocs";

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
    <PageLayout title="Markdown Blog Page">
      <DocsList docs={docs} loadError={loadError} />
    </PageLayout>
  );
};

export default DocsPage;

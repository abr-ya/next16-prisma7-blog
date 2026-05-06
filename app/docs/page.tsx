import { PageLayout } from "@/components/layout/page-layout";
import { getLatestMdDocs } from "../_data/getMdDocs";
import { PostsSection } from "@/components/index";

const DocsPage = async () => {
  const posts = await getLatestMdDocs(10);

  return (
    <PageLayout title="Markdown Blog Page">
      <PostsSection posts={posts} />
    </PageLayout>
  );
};

export default DocsPage;

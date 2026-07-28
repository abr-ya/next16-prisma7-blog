import { getMdDocBySlug } from "@/app/_data/getMdDocs";
import { PageLayout, PostArticle } from "@/components/index";
import { buildPageMetadata, getMarkdownMetadataDescription } from "@/lib/site-metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type MdDocPageProps = {
  params: Promise<{ slug: string }>;
};

const getDocDescription = (content?: string | null) =>
  getMarkdownMetadataDescription(content) || "Public markdown doc from the library.";

export const generateMetadata = async ({ params }: MdDocPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getMdDocBySlug(slug);

  if (!post) {
    return buildPageMetadata({
      title: "Docs",
      description: "Public markdown docs from the library.",
      path: `/docs/${slug}`,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: getDocDescription(post.content),
    path: `/docs/${post.slug}`,
    type: "article",
  });
};

const MdDocPage = async ({ params }: MdDocPageProps) => {
  const { slug } = await params;

  const post = await getMdDocBySlug(slug);

  if (!post) notFound();

  return (
    <PageLayout title={post.title}>
      <PostArticle data={post} />
    </PageLayout>
  );
};

export default MdDocPage;

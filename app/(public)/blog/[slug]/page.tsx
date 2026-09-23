import Image from "next/image";
import type { Metadata } from "next";

import { getPostBySlug, updatePostViews } from "@/app/_data/posts";
import type { IPostLink } from "@/app/_interfaces/post.interface";
import { Badge, LinkBlock, PostUserAndCategory, RichTextViewer } from "@/components/index";
import { authSession } from "@/lib/auth-utils";
import { resolvePostDisplayTags } from "@/lib/content-tags";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

const getPostDescription = (content?: string | null) =>
  getTextMetadataDescription(content) || "Public blog post from the library.";

export const generateMetadata = async ({ params }: BlogPostPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return buildPageMetadata({
      title: "Blog",
      description: "Posts, notes, and updates from the public blog.",
      path: `/blog/${slug}`,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: getPostDescription(post.content),
    path: `/blog/${post.slug}`,
    image: post.imageUrl,
    type: "article",
  });
};

const PostDetailPage = async ({ params }: BlogPostPageProps) => {
  const { slug } = await params;
  const session = await authSession();

  console.log("Post Detail,", slug, session?.user.id);

  const post = await getPostBySlug(slug);

  if (!post) return null;

  updatePostViews(post.id);

  const displayTags = resolvePostDisplayTags(post);
  const hasConnectedLinks = post.links.length > 0;

  return (
    <div className="w-full flex flex-col items-center p-6 md:p-2">
      <div className="flex max-w-6xl flex-col gap-6 justify-center">
        <h1 className="text-2xl md:text-5xl font-semibold">{post?.title}</h1>

        {/* User and Category */}
        <PostUserAndCategory
          userName={post.user.name}
          userImage={post.user.image}
          createdAt={post.createdAt}
          categoryId={post?.category?.id}
          categoryName={post?.category?.name}
        />

        {/* Image */}
        <div className="relative h-100 w-auto">
          <Image
            src={post.imageUrl}
            alt={post.title}
            className="rounded-sm object-contain border-2 border-gray-200"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* RichTextViewer */}
        <RichTextViewer content={post?.content} />

        {displayTags.length > 0 ? (
          <div className="flex gap-2 py-6 flex-wrap">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {/* Links */}
        {hasConnectedLinks ? (
          session?.user.id ? (
            <div className="flex flex-col gap-2 py-6">
              <h3 className="text-xl font-semibold">Connected links:</h3>
              {post.links.map((pl: IPostLink) => (
                <LinkBlock key={pl.linkId} pl={pl} userID={session.user.id} />
              ))}
            </div>
          ) : (
            <div className="py-6">Log in to see links</div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default PostDetailPage;

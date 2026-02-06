import Image from "next/image";

import { getPostBySlug, updatePostViews } from "@/app/_data/posts";
import { IPostDetails } from "@/app/_interfaces/post.interface";
import { LinkBlock, PostUserAndCategory, RichTextViewer } from "@/components/index";
import { authSession } from "@/lib/auth-utils";

const PostDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const session = await authSession();

  console.log("Post Detail,", slug, session?.user.id);

  const post: IPostDetails = await getPostBySlug(slug);

  updatePostViews(post?.id as string);

  if (!post) return null;

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

        <div className="flex gap-2 py-6 flex-wrap">todo: tags</div>
        {/* Links */}
        {session?.user.id ? (
          <div className="flex flex-col gap-2 py-6">
            <h3 className="text-xl font-semibold">Connected links:</h3>
            {post.links.map((pl) => (
              <LinkBlock key={pl.linkId} pl={pl} userID={session?.user.id} />
            ))}
          </div>
        ) : post.links.length ? (
          <div className="py-6">Log in to see links</div>
        ) : null}
      </div>
    </div>
  );
};

export default PostDetailPage;

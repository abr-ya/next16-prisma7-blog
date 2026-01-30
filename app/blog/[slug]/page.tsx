import { getPostBySlug, updatePostViews } from "@/app/_data/posts";
import { IPostDetails } from "@/app/_interfaces/post.interface";
import { LinkBlock, RichTextViewer } from "@/components/index";
import { authSession } from "@/lib/auth-utils";

const BlogPostPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const session = await authSession();

  console.log("Post Detail,", slug, session?.user.id);

  const post: IPostDetails = await getPostBySlug(slug);
  console.log(
    "post links",
    post.links.map((pl) => pl.link),
  );

  updatePostViews(post?.id as string);

  if (!post) return null;

  return (
    <div className="w-full flex flex-col items-center p-6 md:p-0">
      <div className="flex max-w-6xl flex-col gap-6 justify-center">
        <h1 className="text-2xl md:text-5xl font-semibold">{post?.title}</h1>

        {/* RichTextViewer */}
        <RichTextViewer content={post?.content} />

        <div className="flex gap-2 py-6 flex-wrap">todo: tags</div>
        {/* Links */}
        {session?.user.id ? (
          <div className="flex gap-2 py-6 flex-wrap">
            {post.links.map((pl) => (
              <LinkBlock key={pl.linkId} pl={pl} userID={session?.user.id} />
            ))}
          </div>
        ) : (
          <div className="py-6">Log in to see links</div>
        )}
      </div>
    </div>
  );
};

export default BlogPostPage;

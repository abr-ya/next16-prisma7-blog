const BlogPostPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  console.log("Post Detail,", slug);

  // getBlogPostBySlug(slug);

  // updatePostViews(post?.id as string);

  // (!post) return null;

  return (
    <div className="w-full flex flex-col items-center p-6 md:p-0">
      <div className="flex max-w-6xl flex-col gap-6 justify-center">
        <h1 className="text-2xl md:text-5xl font-semibold">{slug} == post.title</h1>

        {/* todo: RichTextViewer */}

        <div className="flex gap-2 py-6 flex-wrap">todo: tags</div>
      </div>
    </div>
  );
};

export default BlogPostPage;

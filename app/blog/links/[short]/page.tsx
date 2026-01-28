const BlogLinkPage = async ({ params }: { params: Promise<{ short: string }> }) => {
  const { short } = await params;
  console.log("Link Detail,", short);

  return (
    <div className="w-full flex flex-col items-center p-6 md:p-0">
      <div className="flex max-w-6xl flex-col gap-6 justify-center">
        <h1 className="text-2xl md:text-5xl font-semibold">{short}</h1>
      </div>
    </div>
  );
};

export default BlogLinkPage;

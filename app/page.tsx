import { AboutSection, HeroSection, PostsSection } from "@/components/index";
import { getLatestBlogPosts } from "./_data/getBlogPosts";

const HomePage = async () => {
  const mdBlogPosts = await getLatestBlogPosts();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Recent Markdown Posts */}
      <PostsSection posts={mdBlogPosts} showAllLink title="Recent Markdown Posts" className="py-10 px-4" />
    </main>
  );
};

export default HomePage;

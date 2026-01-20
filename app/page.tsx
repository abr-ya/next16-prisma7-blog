import { AboutSection, HeroSection, PostsSection } from "@/components/index";
import { getLatestBlogPosts } from "./_data";

const HomePage = async () => {
  const blogPosts = await getLatestBlogPosts();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Recent Markdown Posts */}
      <PostsSection posts={blogPosts} showAllLink title="Recent Markdown Posts" className="py-10 px-4" />
    </main>
  );
};

export default HomePage;

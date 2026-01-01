import { AboutSection, HeroSection, PostsSection } from "@/components/index";
import { getLatestBlogPosts } from "./_data";

const HomePage = async () => {
  const posts = await getLatestBlogPosts();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Recent Posts */}
      <PostsSection posts={posts} showAllLink title="Recent Posts" className="py-10 px-4" />
    </main>
  );
};

export default HomePage;

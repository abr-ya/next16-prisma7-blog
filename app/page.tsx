import { AboutSection, HeroSection, PostsSection } from "@/components/index";
import { getLatestPosts } from "./_data";

const HomePage = async () => {
  const posts = await getLatestPosts();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Recent Posts */}
      <PostsSection posts={posts} showAllLink />
    </main>
  );
};

export default HomePage;

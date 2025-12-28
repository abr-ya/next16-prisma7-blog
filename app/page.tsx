import { AboutSection, HeroSection } from "@/components/index";
import { getLatestPosts } from "./_data";

const HomePage = async () => {
  const posts = await getLatestPosts();

  console.log(posts);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Recent Posts */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
      </section>
    </main>
  );
};

export default HomePage;

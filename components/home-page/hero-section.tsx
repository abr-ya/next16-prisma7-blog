import Link from "next/link";
import { Button } from "..";
import { MessageCircle, PieChart } from "lucide-react";

export const HeroSection = () => (
  <section className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <h2 className="text-4xl font-bold mb-4">Hi, I'm Yaroslav</h2>
    <p className="text-muted-foreground text-lg max-w-md mb-6">
      A full-stack developer passionate about building great web experiences.
    </p>
    <h1 className="text-2xl font-bold mb-2">Actual blog, version 2.0:</h1>
    <div className="flex gap-4 mb-6">
      <Button variant="outline" asChild>
        <Link href="/blog">Main Page</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/dashboard">
          <PieChart className="w-4 h-4 mr-2" />
          Dashboard
        </Link>
      </Button>
    </div>
    <h2 className="text-2xl font-bold mb-2">Previos blog, version 1.0 (use Markdown):</h2>
    <div className="flex gap-4">
      <Button asChild>
        <Link href="/blog-md">Read Markdown Posts</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/comments">
          <MessageCircle className="w-4 h-4 mr-2" />
          Comments Page
        </Link>
      </Button>
    </div>
  </section>
);

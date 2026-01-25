import Link from "next/link";
import { Button } from "..";
import { MessageCircle, PieChart } from "lucide-react";

export const HeroSection = () => (
  <section className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <h1 className="text-4xl font-bold mb-4">Hi, I'm Yaroslav</h1>
    <p className="text-muted-foreground text-lg max-w-md mb-6">
      A full-stack developer passionate about building great web experiences.
    </p>
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
      <Button variant="outline" asChild>
        <Link href="/blog">New Blog Page</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/dashboard">
          <PieChart className="w-4 h-4 mr-2" />
          Dashboard
        </Link>
      </Button>
    </div>
  </section>
);

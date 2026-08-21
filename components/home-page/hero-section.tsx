import Link from "next/link";
import { Badge, Button } from "..";
import { ArrowRight, FileText, MessageCircle, PenLine, PieChart, Video } from "lucide-react";

const contentSections = [
  {
    href: "/blog",
    title: "Blog",
    description: "Posts, notes, and longer written pieces from the site.",
    icon: PenLine,
  },
  {
    href: "/videos",
    title: "Video Links",
    description: "Saved videos, channels, bookmarks, and useful watching notes.",
    icon: Video,
  },
  {
    href: "/docs",
    title: "Markdown Documents",
    description: "Structured docs, references, and technical write-ups.",
    icon: FileText,
  },
  {
    href: "/comments",
    title: "Comments",
    description: "A public comment space for the site. Still evolving.",
    icon: MessageCircle,
    status: "Work in progress",
  },
];

export const HeroSection = () => (
  <section className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-10 text-center">
    <h2 className="mb-4 text-4xl font-bold">Hi, I'm Yaroslav</h2>
    <p className="mb-8 max-w-xl text-lg text-muted-foreground">
      A full-stack developer passionate about building great web experiences.
    </p>

    <div className="mb-8 max-w-2xl">
      <h1 className="mb-3 text-2xl font-bold">Content Hub</h1>
      <p className="text-muted-foreground">
        Start with the main public sections: writing, video references, markdown documents, and the comment space.
      </p>
    </div>

    <div className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
      {contentSections.map((section) => {
        const Icon = section.icon;

        return (
          <Link
            key={section.href}
            href={section.href}
            className="group flex min-h-48 flex-col justify-between rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span>
              <span className="mb-4 flex items-center justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {section.status ? <Badge variant="secondary">{section.status}</Badge> : null}
              </span>
              <span className="mb-2 block text-lg font-semibold leading-tight">{section.title}</span>
              <span className="block text-sm leading-6 text-muted-foreground">{section.description}</span>
            </span>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
              Open section
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        );
      })}
    </div>

    <Button variant="ghost" size="sm" asChild className="mt-6 text-muted-foreground">
      <Link href="/admin">
        <PieChart className="size-4" />
        Admin dashboard
      </Link>
    </Button>
  </section>
);

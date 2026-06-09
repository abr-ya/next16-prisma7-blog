import { ArrowRight } from "lucide-react";
import type { MdDoc } from "@/generated/prisma/client";
import { Button } from "../ui/button";
import { MdPostCard } from "./md-post-card";
import Link from "next/link";

interface DocsListProps {
  className?: string;
  docs: MdDoc[];
  showAllDocsLink?: boolean;
  title?: string;
  /** When set, shows this error instead of the docs list (e.g. DB unreachable). */
  loadError?: string | null;
}

export const DocsList = ({ className, docs, showAllDocsLink, title, loadError }: DocsListProps) => (
  <section className={`max-w-3xl mx-auto ${className}`}>
    {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
    {loadError ? (
      <div
        className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        role="alert"
      >
        {loadError}
      </div>
    ) : docs.length > 0 ? (
      <div className="flex flex-col gap-4">
        {docs.map((doc) => (
          <MdPostCard post={doc} key={doc.id} />
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground">No docs yet.</p>
    )}
    {showAllDocsLink && !loadError && (
      <Button variant="link" asChild className="mt-4 px-0">
        <Link href="/docs">
          View all docs <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </Button>
    )}
  </section>
);

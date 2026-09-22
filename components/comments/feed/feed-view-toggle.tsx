"use client";

import Link from "next/link";

import type { CommentListView } from "@/app/_data/comments";
import { cn } from "@/lib/utils";

type FeedViewToggleProps = {
  currentView: CommentListView;
  currentPage: number;
};

const buildHref = (view: CommentListView, currentPage: number): string => {
  const params = new URLSearchParams();

  if (view === "mine") params.set("view", "mine");
  if (currentPage > 1) params.set("page", String(currentPage));

  const query = params.toString();

  return query ? `/comments?${query}` : "/comments";
};

const linkBaseClass =
  "inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export const FeedViewToggle = ({ currentView, currentPage }: FeedViewToggleProps) => {
  return (
    <div
      role="group"
      aria-label="Comments view"
      className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center gap-1 rounded-lg p-1"
    >
      <Link
        href={buildHref("all", currentPage)}
        aria-current={currentView === "all" ? "page" : undefined}
        className={cn(
          linkBaseClass,
          currentView === "all" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
        )}
      >
        All
      </Link>
      <Link
        href={buildHref("mine", currentPage)}
        aria-current={currentView === "mine" ? "page" : undefined}
        className={cn(
          linkBaseClass,
          currentView === "mine" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
        )}
      >
        Mine
      </Link>
    </div>
  );
};

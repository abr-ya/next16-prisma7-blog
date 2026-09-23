import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FEED_PAGE_SIZE, getCommentListItems, type CommentListView } from "@/app/_data/comments";
import { Button } from "@/components/index";
import { CommentList } from "@/components/comments/comment-list";
import { FeedViewToggle } from "@/components/comments/feed/feed-view-toggle";
import { PageLayout } from "@/components/layout/page-layout";
import { authSession } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Comments",
  description: "Public comments and messages for the site.",
  path: "/comments",
});

type CommentsPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    view?: string | string[];
  }>;
};

const getPageValue = (page: string | string[] | undefined): number => {
  const value = Array.isArray(page) ? page[0] : page;
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const getViewValue = (view: string | string[] | undefined): CommentListView => {
  const value = Array.isArray(view) ? view[0] : view;

  return value === "mine" ? "mine" : "all";
};

const buildCommentsHref = (nextPage: number, view: CommentListView): string => {
  const params = new URLSearchParams();

  if (view === "mine") params.set("view", "mine");
  if (nextPage > 1) params.set("page", String(nextPage));

  const query = params.toString();

  return query ? `/comments?${query}` : "/comments";
};

const CommentsPage = async ({ searchParams }: CommentsPageProps) => {
  const params = await searchParams;
  const requestedPage = getPageValue(params?.page);
  const view = getViewValue(params?.view);
  const session = await authSession();
  const viewerId = session?.user?.id ?? null;

  const { items, total, page, totalPages } = await getCommentListItems({
    page: requestedPage,
    pageSize: FEED_PAGE_SIZE,
    viewerId,
    view,
    order: "desc",
  });

  const emptyState =
    view === "mine" ? (
      <p className="text-muted-foreground">You haven&apos;t left any comments yet.</p>
    ) : (
      <p className="text-muted-foreground">No comments to show yet.</p>
    );

  const showPagination = totalPages > 1;

  return (
    <PageLayout title="Comments" showBackLink={false}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total} comment${total === 1 ? "" : "s"} · newest first` : "Newest comments first."}
        </p>
        {viewerId ? <FeedViewToggle currentView={view} currentPage={page} /> : null}
      </div>
      <CommentList comments={items} emptyState={emptyState} />
      {showPagination ? (
        <nav className="mt-8 flex flex-row items-center justify-center gap-6" aria-label="Comments pages">
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Previous page"
            aria-disabled={page <= 1}
            className={cn(page <= 1 && "pointer-events-none opacity-50")}
          >
            <Link href={buildCommentsHref(Math.max(1, page - 1), view)}>
              <ChevronLeft />
            </Link>
          </Button>
          <p className="text-sm">
            Page {page} of {totalPages}
          </p>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label="Next page"
            aria-disabled={page >= totalPages}
            className={cn(page >= totalPages && "pointer-events-none opacity-50")}
          >
            <Link href={buildCommentsHref(page + 1, view)}>
              <ChevronRight />
            </Link>
          </Button>
        </nav>
      ) : null}
    </PageLayout>
  );
};

export default CommentsPage;

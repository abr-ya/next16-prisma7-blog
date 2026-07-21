import { format } from "date-fns";
import { ArrowDownAZ, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";

import { getPublicVideos } from "@/app/_data/videos";
import type { PublicVideoSort } from "@/app/_data/videos";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { formatVideoDuration, formatVideoProvider } from "@/lib/video-metadata-format";

export const dynamic = "force-dynamic";

type VideosPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    sort?: string | string[];
  }>;
};

const DEFAULT_PUBLIC_VIDEO_SORT: PublicVideoSort = "videoDate-desc";

const sortOptions = [
  { value: "videoDate-desc", label: "Video date", icon: CalendarDays },
  { value: "createdAt-desc", label: "Recently added", icon: Clock3 },
  { value: "title-asc", label: "Title", icon: ArrowDownAZ },
] as const satisfies { value: PublicVideoSort; label: string; icon: typeof CalendarDays }[];

const getSortValue = (sort: string | string[] | undefined): PublicVideoSort => {
  const value = Array.isArray(sort) ? sort[0] : sort;

  return sortOptions.some((option) => option.value === value) ? (value as PublicVideoSort) : DEFAULT_PUBLIC_VIDEO_SORT;
};

const getSortHref = (sort: PublicVideoSort) =>
  sort === DEFAULT_PUBLIC_VIDEO_SORT ? "/videos" : `/videos?sort=${sort}`;

const getPageValue = (page: string | string[] | undefined) => {
  const value = Array.isArray(page) ? page[0] : page;
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const getPageHref = ({ page, sort }: { page: number; sort: PublicVideoSort }) => {
  const params = new URLSearchParams();

  if (sort !== DEFAULT_PUBLIC_VIDEO_SORT) {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/videos?${query}` : "/videos";
};

const VideosPage = async ({ searchParams }: VideosPageProps) => {
  const params = await searchParams;
  const activeSort = getSortValue(params?.sort);
  const requestedPage = getPageValue(params?.page);
  const { videos, totalCount, page, pageCount } = await getPublicVideos({ sort: activeSort, page: requestedPage });
  const hasPagination = pageCount > 1;

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Videos</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">Public video links from the library.</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Sort videos">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Button key={value} asChild variant={activeSort === value ? "default" : "outline"} size="sm">
                <Link href={getSortHref(value)} aria-current={activeSort === value ? "page" : undefined}>
                  <Icon />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {videos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {videos.map((video) => (
                <Card key={video.id} className="gap-3">
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Badge variant="secondary">Public</Badge>
                        {formatVideoProvider(video.provider) ? (
                          <Badge variant="outline">{formatVideoProvider(video.provider)}</Badge>
                        ) : null}
                        {formatVideoDuration(video.durationSeconds) ? (
                          <Badge variant="outline">{formatVideoDuration(video.durationSeconds)}</Badge>
                        ) : null}
                        {video.channel ? (
                          <Badge asChild variant="outline" className="max-w-40">
                            <a href={video.channel.url} target="_blank" rel="noreferrer" className="truncate">
                              {video.channel.name}
                            </a>
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {format(video.videoDate, "PPP")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="size-3.5" />
                          Added {format(video.createdAt, "PPP")}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-xl leading-tight">
                      <Link href={`/videos/${video.id}`} className="hover:underline">
                        {video.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/videos/${video.id}`}>
                        <PlayCircle />
                        Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={video.url} target="_blank" rel="noreferrer">
                        <ExternalLink />
                        Open video
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {hasPagination ? (
              <nav
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                aria-label="Videos pages"
              >
                <p className="text-sm text-muted-foreground">
                  Page {page} of {pageCount} - {totalCount} videos
                </p>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                  >
                    <Link href={getPageHref({ page: Math.max(1, page - 1), sort: activeSort })}>
                      <ChevronLeft />
                      Previous
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    aria-disabled={page >= pageCount}
                    className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
                  >
                    <Link href={getPageHref({ page: Math.min(pageCount, page + 1), sort: activeSort })}>
                      Next
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </nav>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">No public videos yet.</p>
        )}
      </section>
    </main>
  );
};

export default VideosPage;

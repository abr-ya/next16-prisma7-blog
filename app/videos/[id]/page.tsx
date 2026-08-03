import { format } from "date-fns";
import { CalendarDays, ExternalLink, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicVideoBookmarks } from "@/app/_data/video-bookmarks";
import { getPublicVideoCommentListItems } from "@/app/_data/video-comments";
import { getPublicVideoById } from "@/app/_data/videos";
import { Badge, Button } from "@/components/index";
import { VideoBookmarkManager } from "@/components/video-pages/video-bookmark-manager";
import { VideoCommentComposer } from "@/components/video-pages/video-comment-composer";
import { VideoDetailMedia } from "@/components/video-pages/video-detail-media";
import { authSession } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import { formatVideoDuration, formatVideoProvider } from "@/lib/video-metadata-format";

type PublicVideoPageProps = {
  params: Promise<{ id: string }>;
};

const getVideoDescription = (title?: string | null) =>
  title ? `Watch "${title}" from the public video library.` : "Public video link from the library.";

export const generateMetadata = async ({ params }: PublicVideoPageProps): Promise<Metadata> => {
  const { id } = await params;
  const video = await getPublicVideoById(id);

  if (!video) {
    return buildPageMetadata({
      title: "Video",
      description: getVideoDescription(),
      path: `/videos/${id}`,
    });
  }

  return buildPageMetadata({
    title: video.title,
    description: getVideoDescription(video.title),
    path: `/videos/${video.id}`,
    image: video.thumbnailUrl,
    type: "article",
  });
};

const PublicVideoPage = async ({ params }: PublicVideoPageProps) => {
  const { id } = await params;
  const video = await getPublicVideoById(id);

  if (!video) notFound();

  const session = await authSession();
  const bookmarks = session ? await getPublicVideoBookmarks(video.id) : [];
  const comments = await getPublicVideoCommentListItems(video.id);
  const providerLabel = formatVideoProvider(video.provider);
  const durationLabel = formatVideoDuration(video.durationSeconds);

  return (
    <main className="min-h-screen px-4 py-10">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Public</Badge>
            {providerLabel ? <Badge variant="outline">{providerLabel}</Badge> : null}
            {durationLabel ? <Badge variant="outline">{durationLabel}</Badge> : null}
            {video.channel ? (
              <Badge asChild variant="outline" className="max-w-full">
                <a href={video.channel.url} target="_blank" rel="noreferrer" className="truncate">
                  <ExternalLink className="size-3" />
                  {video.channel.name}
                </a>
              </Badge>
            ) : null}
            {video.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline" className="max-w-full truncate">
                {tag.name}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-semibold leading-tight md:text-3xl">{video.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" />
              Video date: {format(video.videoDate, "PPP")}
            </span>
            <span>Added: {format(video.createdAt, "PPP")}</span>
          </div>
        </div>

        <VideoDetailMedia
          title={video.title}
          videoUrl={video.url}
          thumbnailUrl={video.thumbnailUrl}
          embedUrl={video.embedUrl}
        />

        <div className="grid gap-4">
          <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 break-all text-sm text-muted-foreground sm:break-normal">{video.url}</div>
            <Button asChild className="w-full shrink-0 sm:w-auto">
              <a href={video.url} target="_blank" rel="noreferrer">
                {video.embedUrl ? <PlayCircle /> : <ExternalLink />}
                Open video
              </a>
            </Button>
          </div>

          {session ? (
            <VideoBookmarkManager videoId={video.id} videoUrl={video.url} initialBookmarks={bookmarks} />
          ) : null}

          <VideoCommentComposer videoId={video.id} initialComments={comments} isAuthenticated={Boolean(session)} />
        </div>
      </article>
    </main>
  );
};

export default PublicVideoPage;

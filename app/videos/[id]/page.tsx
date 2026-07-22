import { format } from "date-fns";
import { CalendarDays, ExternalLink, PlayCircle } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublicVideoById } from "@/app/_data/videos";
import { Badge, Button } from "@/components/index";
import { VideoThumbnail } from "@/components/video-pages/video-thumbnail";
import { formatVideoDuration, formatVideoProvider } from "@/lib/video-metadata-format";

const PublicVideoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const video = await getPublicVideoById(id);

  if (!video) notFound();

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

        {video.embedUrl ? (
          <iframe
            src={video.embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full rounded-md border bg-muted"
          />
        ) : (
          <VideoThumbnail src={video.thumbnailUrl} title={video.title} videoUrl={video.url} />
        )}

        <div className="rounded-md border bg-muted/30 p-4">
          <div className="break-all text-sm text-muted-foreground">{video.url}</div>
        </div>

        <div>
          <Button asChild>
            <a href={video.url} target="_blank" rel="noreferrer">
              {video.embedUrl ? <PlayCircle /> : <ExternalLink />}
              Open video
            </a>
          </Button>
        </div>
      </article>
    </main>
  );
};

export default PublicVideoPage;

import { format } from "date-fns";
import { CalendarDays, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublicVideoById } from "@/app/_data/videos";
import { Badge, Button } from "@/components/index";
import { VideoThumbnail } from "@/components/video-pages/video-thumbnail";

const PublicVideoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const video = await getPublicVideoById(id);

  if (!video) notFound();

  return (
    <main className="min-h-screen px-4 py-10">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary">Public</Badge>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">{video.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" />
              Video date: {format(video.videoDate, "PPP")}
            </span>
            <span>Added: {format(video.createdAt, "PPP")}</span>
          </div>
        </div>

        <VideoThumbnail src={video.thumbnailUrl} title={video.title} videoUrl={video.url} />

        <div className="rounded-md border bg-muted/30 p-4">
          <div className="break-all text-sm text-muted-foreground">{video.url}</div>
        </div>

        <div>
          <Button asChild>
            <a href={video.url} target="_blank" rel="noreferrer">
              <ExternalLink />
              Open video
            </a>
          </Button>
        </div>
      </article>
    </main>
  );
};

export default PublicVideoPage;

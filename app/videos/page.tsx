import { format } from "date-fns";
import { CalendarDays, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";

import { getPublicVideos } from "@/app/_data/videos";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/index";

export const dynamic = "force-dynamic";

const VideosPage = async () => {
  const videos = await getPublicVideos();

  return (
    <main className="min-h-screen px-4 py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Public video links from the library.</p>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {videos.map((video) => (
              <Card key={video.id} className="gap-3">
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary">Public</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {format(video.videoDate, "PPP")}
                    </span>
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
        ) : (
          <p className="text-muted-foreground">No public videos yet.</p>
        )}
      </section>
    </main>
  );
};

export default VideosPage;

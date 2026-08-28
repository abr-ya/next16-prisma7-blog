import { CalendarDays, Download, FileText, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getPublicTracks } from "@/app/_data/tracks";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { formatFileSize } from "@/lib/file-upload-limits";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";
import { formatTrackDistance, formatTrackPointCount } from "@/lib/track-gpx-metadata";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Tracks",
  description: "Published GPX tracks and outdoor route files.",
  path: "/tracks",
});

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const TracksPage = async () => {
  const tracks = await getPublicTracks();

  return (
    <PageLayout title="Tracks" className="pt-6" showBackLink={false}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10">
        {tracks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tracks.map((track) => (
              <Card key={track.id} className="gap-3">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Route className="size-3.5" />
                      GPX track
                    </Badge>
                    <Badge variant="outline">
                      <CalendarDays className="size-3.5" />
                      {formatDate(track.updatedAt)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    <Link href={`/tracks/${track.slug}`} className="hover:underline">
                      {track.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {track.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {getTextMetadataDescription(track.description, 220)}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    <span className="max-w-56 truncate" title={track.file.name}>
                      {track.file.name}
                    </span>
                    <span>{formatFileSize(track.file.sizeBytes)}</span>
                  </div>
                  {track.parsed ? (
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{formatTrackDistance(track.parsed.summary.distanceMeters)}</Badge>
                      <Badge variant="outline">{formatTrackPointCount(track.parsed.summary.points)}</Badge>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/tracks/${track.slug}`}>
                        <Route />
                        Details
                      </Link>
                    </Button>
                    {track.file.downloadUrl ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={track.file.downloadUrl}>
                          <Download />
                          Download GPX
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="outline">Download unavailable</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No published tracks yet.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TracksPage;

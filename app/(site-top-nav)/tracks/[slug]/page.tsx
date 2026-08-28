import { CalendarDays, Download, FileText, Route, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicTrackBySlug } from "@/app/_data/tracks";
import { Badge, Button } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { formatFileSize } from "@/lib/file-upload-limits";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";
import {
  formatTrackDistance,
  formatTrackDuration,
  formatTrackElevationGainLoss,
  formatTrackElevationRange,
  formatTrackPointCount,
} from "@/lib/track-gpx-metadata";

type TrackPageProps = {
  params: Promise<{ slug: string }>;
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const generateMetadata = async ({ params }: TrackPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const track = await getPublicTrackBySlug(slug);

  if (!track) {
    return buildPageMetadata({
      title: "Tracks",
      description: "Published GPX tracks and outdoor route files.",
      path: `/tracks/${slug}`,
    });
  }

  return buildPageMetadata({
    title: track.title,
    description: getTextMetadataDescription(track.description) || "Published GPX track and outdoor route file.",
    path: `/tracks/${track.slug}`,
    type: "article",
  });
};

const TrackPage = async ({ params }: TrackPageProps) => {
  const { slug } = await params;
  const track = await getPublicTrackBySlug(slug);

  if (!track) notFound();

  return (
    <PageLayout title={track.title} className="pt-6" showBackLink={false}>
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Route className="size-3.5" />
            GPX track
          </Badge>
          <Badge variant="outline">
            <CalendarDays className="size-3.5" />
            Updated {formatDate(track.updatedAt)}
          </Badge>
        </div>

        {track.description ? (
          <div className="whitespace-pre-wrap text-base leading-7 text-foreground">{track.description}</div>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}

        {track.parsed ? (
          <section className="grid gap-3 rounded-md border p-4">
            <h2 className="text-base font-semibold">GPX summary</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Distance</div>
                <div className="font-medium">{formatTrackDistance(track.parsed.summary.distanceMeters)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Points</div>
                <div className="font-medium">{formatTrackPointCount(track.parsed.summary.points)}</div>
              </div>
              {track.parsed.summary.elevation ? (
                <>
                  <div>
                    <div className="text-muted-foreground">Elevation range</div>
                    <div className="font-medium">{formatTrackElevationRange(track.parsed.summary.elevation)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Gain / loss</div>
                    <div className="font-medium">{formatTrackElevationGainLoss(track.parsed.summary.elevation)}</div>
                  </div>
                </>
              ) : null}
              {track.parsed.summary.time ? (
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">{formatTrackDuration(track.parsed.summary.time.durationSeconds)}</div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 rounded-md border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium">{track.file.name}</span>
            <Badge variant="outline">{formatFileSize(track.file.sizeBytes)}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Upload className="size-3.5" />
              Uploaded {formatDate(track.file.uploadedAt)}
            </span>
            <span>File updated {formatDate(track.file.updatedAt)}</span>
          </div>
          <div>
            {track.file.downloadUrl ? (
              <Button asChild>
                <Link href={track.file.downloadUrl}>
                  <Download />
                  Download GPX
                </Link>
              </Button>
            ) : (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                GPX download is unavailable for this track.
              </div>
            )}
          </div>
        </section>
      </article>
    </PageLayout>
  );
};

export default TrackPage;

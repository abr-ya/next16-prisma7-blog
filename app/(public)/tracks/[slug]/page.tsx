import { CalendarDays, Clock, Download, FileText, Lock, Map, Route, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicTrackBySlug } from "@/app/_data/tracks";
import { Badge, Button } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { TrackFileRenameButton } from "@/components/track-pages/track-file-rename-button";
import { TrackMap } from "@/components/track-pages/track-map";
import { TrackPointCleanupButton } from "@/components/track-pages/track-point-cleanup-dialog";
import { authSession } from "@/lib/auth-utils";
import { formatFileSize } from "@/lib/file-upload-limits";
import { formatHikeDateRange, formatHikeType } from "@/lib/hikes";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";
import {
  formatTrackDistance,
  formatTrackDuration,
  formatTrackElevationGainLoss,
  formatTrackElevationRange,
  formatTrackPointCount,
  formatTrackRecordingLine,
  formatTrackTimeSource,
  formatTrackTimezoneEvidence,
} from "@/lib/track-gpx-metadata";
import { formatTrackRecordingTimezone } from "@/lib/track-recording-timezone";

type TrackPageProps = {
  params: Promise<{ slug: string }>;
};

// feature-138: the page reads the viewer's session for the owner-only cleanup
// action and must never be served from a stale static/ISR cache after a GPX
// rewrite swaps the track's file and metadata.
export const dynamic = "force-dynamic";

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
  const session = await authSession();
  const track = await getPublicTrackBySlug(slug, session?.user.id ?? null);

  if (!track) notFound();

  // feature-139: the header owns the recording time. GPX tracks read the
  // parsed summary times; MANUAL tracks read the stored start and duration
  // and never derive a finish.
  const recordingLine = formatTrackRecordingLine({
    source: track.timeSource === "MANUAL" ? "MANUAL" : "GPX",
    start:
      track.timeSource === "MANUAL"
        ? (track.recordingStartAt?.toISOString() ?? null)
        : (track.parsed?.summary.time?.start ?? null),
    finish: track.timeSource === "MANUAL" ? null : (track.parsed?.summary.time?.end ?? null),
    durationSeconds: track.timeSource === "MANUAL" ? track.recordingDurationSeconds : null,
    recordingTimezone: track.recordingTimezone,
  });

  return (
    <PageLayout title={track.title} className="pt-6">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Route className="size-3.5" />
            GPX track
          </Badge>
          {track.timeSource ? (
            <Badge variant="secondary">Source: {formatTrackTimeSource(track.timeSource)}</Badge>
          ) : null}
          <Badge variant="outline">
            <CalendarDays className="size-3.5" />
            Updated {formatDate(track.updatedAt)}
          </Badge>
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:ml-auto">
            <Clock className="size-3.5 shrink-0" />
            <span className="shrink-0 font-medium">Recording</span>
            <span className="min-w-0">{recordingLine}</span>
          </div>
        </div>

        {track.description ? (
          <div className="whitespace-pre-wrap text-base leading-7 text-foreground">{track.description}</div>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}

        {track.privateNote ? (
          <section className="grid gap-2 rounded-md border border-dashed bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="size-4" />
              Your private note
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{track.privateNote}</p>
            <p className="text-xs text-muted-foreground">Only you can see this note.</p>
          </section>
        ) : null}

        <section className="grid gap-3">
          <h2 className="text-base font-semibold">Route map</h2>
          {track.map ? (
            <TrackMap key={track.file.id} track={track.map} />
          ) : (
            <div className="flex h-48 min-h-48 items-center justify-center rounded-md border bg-muted p-4 text-center text-sm text-muted-foreground">
              Map preview is unavailable until this track has parsed route geometry.
            </div>
          )}
        </section>

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
                <>
                  <div>
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-medium">{formatTrackDuration(track.parsed.summary.time.durationSeconds)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Recording timezone</div>
                    <div className="font-medium">{formatTrackRecordingTimezone(track.recordingTimezone)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Timezone evidence</div>
                    <div className="font-medium">
                      {formatTrackTimezoneEvidence(track.parsed.summary.time.timezoneEvidence)}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        {track.hikes.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="text-base font-semibold">Linked hikes</h2>
            <div className="grid gap-3">
              {track.hikes.map((hike) => (
                <div key={hike.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-2">
                      <div className="font-medium">{hike.title}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{formatHikeType(hike.type)}</Badge>
                        <Badge variant="outline">
                          <CalendarDays className="size-3.5" />
                          {formatHikeDateRange(hike)}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/trips/${hike.slug}`}>
                        <Map />
                        Open hike
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 rounded-md border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium">{track.file.name}</span>
            {track.canRenameFile ? <TrackFileRenameButton trackId={track.id} fileName={track.file.name} /> : null}
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
          {track.canCleanPoints ? <TrackPointCleanupButton trackId={track.id} trackTitle={track.title} /> : null}
        </section>
      </article>
    </PageLayout>
  );
};

export default TrackPage;

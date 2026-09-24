import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CalendarDays, Route } from "lucide-react";

import {
  getHikeParticipantManagementBySlug,
  getHikePhotoDetail,
  getHikePhotoContributionCapabilityBySlug,
  getPublicHikePhotoLikeStates,
  getPublicHikeBySlug,
} from "@/app/_data/hikes";
import { getCommentListItems } from "@/app/_data/comments";
import { HikeParticipantManager } from "@/components/hike-pages/hike-participant-manager";
import type { HikePhotoGalleryItem } from "@/components/hike-pages/hike-photo-gallery";
import { HikeTripMedia } from "@/components/hike-pages/hike-trip-media";
import { Badge, Button } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { authSession } from "@/lib/auth-utils";
import { formatHikeDateRange, formatHikeType } from "@/lib/hikes";
import { SITE_CONTENT_WIDTH } from "@/lib/site-content-width";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";
import { formatTrackRecordingTimeRange, formatTrackTimezoneEvidence } from "@/lib/track-gpx-metadata";
import { formatTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import { cn } from "@/lib/utils";

type HikePageProps = {
  params: Promise<{ slug: string }>;
};

export const generateTripMetadata = async ({ params }: HikePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const hike = await getPublicHikeBySlug(slug);

  if (!hike) {
    return buildPageMetadata({
      title: "Trips",
      description: "Published hikes and outdoor trip notes.",
      path: `/trips/${slug}`,
    });
  }

  return buildPageMetadata({
    title: hike.title,
    description: getTextMetadataDescription(hike.description) || "Published hike and outdoor trip notes.",
    path: `/trips/${hike.slug}`,
    type: "article",
  });
};

export const TripPage = async ({ params }: HikePageProps) => {
  const { slug } = await params;
  const [hike, session, participantManagement, photoContributionCapability] = await Promise.all([
    getPublicHikeBySlug(slug),
    authSession(),
    getHikeParticipantManagementBySlug(slug),
    getHikePhotoContributionCapabilityBySlug(slug),
  ]);

  if (!hike) notFound();

  const canViewFullPhotos = Boolean(session?.user?.id);
  const photoLikeStates = session
    ? await getPublicHikePhotoLikeStates({
        hikeId: hike.id,
        photoIds: hike.photos.map(({ photo }) => photo.id),
      })
    : {};
  const mappedTracks = hike.tracks.flatMap(({ track }) => (track.map ? [track.map] : []));
  const photoMapMarkers = hike.photoMapMarkers;
  const noteMapMarkers = hike.noteMapMarkers;
  const photoDetails = await Promise.all(
    hike.photos.map(({ photo }) => getHikePhotoDetail({ hikeId: hike.id, photoId: photo.id })),
  );
  const galleryPhotos: HikePhotoGalleryItem[] = await Promise.all(
    hike.photos.map(async ({ photo }) => {
      const preview = photo.images.at(0)?.fileAsset;
      const initialComments = canViewFullPhotos
        ? (await getCommentListItems({ photoId: photo.id, order: "asc" })).items
        : [];

      return {
        id: photo.id,
        hikeId: hike.id,
        title: photo.title,
        description: photo.description,
        alt: preview?.name || photo.title,
        thumbnailUrl: preview ? `/files/${preview.id}/thumbnail` : null,
        fullUrl: canViewFullPhotos && preview ? `/files/${preview.id}/download?disposition=inline` : null,
        detail: photoDetails.find((detail) => detail?.photoId === photo.id) ?? null,
        isLikedByViewer: photoLikeStates[photo.id]?.isLikedByViewer ?? false,
        commentCount: initialComments.length,
        initialComments,
        currentUserId: session?.user?.id ?? null,
      };
    }),
  );

  return (
    <PageLayout
      title={hike.title}
      className="pt-6"
      contentWidth="wide"
      headerAction={participantManagement ? <HikeParticipantManager management={participantManagement} /> : null}
    >
      <article className="flex w-full flex-col gap-6 pb-10">
        <div className={cn("flex w-full flex-col gap-6", SITE_CONTENT_WIDTH.narrow)}>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{formatHikeType(hike.type)}</Badge>
            <Badge variant="outline">
              <CalendarDays className="size-3.5" />
              {formatHikeDateRange(hike)}
            </Badge>
          </div>
          {hike.description ? (
            <div className="whitespace-pre-wrap text-base leading-7 text-foreground">{hike.description}</div>
          ) : (
            <p className="text-sm text-muted-foreground">No description yet.</p>
          )}
        </div>
        <HikeTripMedia
          tracks={mappedTracks}
          photoMarkers={photoMapMarkers}
          noteMarkers={noteMapMarkers}
          startDate={hike.startDate}
          endDate={hike.endDate}
          photos={galleryPhotos}
          canViewFullPhotos={canViewFullPhotos}
          photoContributionCapability={photoContributionCapability}
        />
        {hike.tracks.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="text-base font-semibold">Linked tracks</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {hike.tracks.map(({ track }) => (
                <div key={track.id} className="flex h-full flex-col gap-3 rounded-md border p-4">
                  <div className="grid gap-1">
                    <div className="font-medium">{track.title}</div>
                    {track.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{track.description}</p>
                    ) : null}
                    {track.parsed?.summary.time ? (
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {formatTrackRecordingTimeRange(track.parsed.summary.time, track.recordingTimezone)}
                        </Badge>
                        <Badge variant={track.recordingTimezone ? "secondary" : "outline"}>
                          {formatTrackRecordingTimezone(track.recordingTimezone)}
                        </Badge>
                        <Badge
                          variant={
                            track.parsed.summary.time.timezoneEvidence === "UTC_OR_OFFSET" ? "secondary" : "outline"
                          }
                        >
                          {formatTrackTimezoneEvidence(track.parsed.summary.time.timezoneEvidence)}
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                  <Button asChild size="sm" variant="outline" className="mt-auto self-start">
                    <Link href={`/tracks/${track.slug}`}>
                      <Route />
                      Open track
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </PageLayout>
  );
};

export default async function LegacyHikePage({ params }: HikePageProps) {
  const { slug } = await params;
  permanentRedirect(`/trips/${slug}`);
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Route } from "lucide-react";

import type { HikePhotoAcceptedCoordinate, HikePhotoContributionCapability } from "@/app/_data/hikes";
import {
  HikePhotoGallery,
  type HikePhotoGalleryHandle,
  type HikePhotoGalleryItem,
} from "@/components/hike-pages/hike-photo-gallery";
import { HikeTrackMap } from "@/components/hike-pages/hike-track-map";
import { Badge, Button } from "@/components/index";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { HikePhotoMapMarker } from "@/lib/hikes";
import { getHikeMapDays } from "@/lib/hike-map-days";
import {
  formatTrackRecordingTimeRange,
  formatTrackTimezoneEvidence,
  type TrackGpxSummary,
  type TrackMapViewModel,
} from "@/lib/track-gpx-metadata";
import { formatTrackRecordingTimezone } from "@/lib/track-recording-timezone";

export type TripPhotoOrder = "capture" | "manual";

type LinkedTrack = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  recordingTimezone: string | null;
  parsed: { summary: TrackGpxSummary } | null;
  map: TrackMapViewModel | null;
};

const ALL_DAYS = "all";

const parsePhotoOrder = (value: string | null): TripPhotoOrder => (value === "manual" ? "manual" : "capture");

const getChronologicalPhotos = (photos: HikePhotoGalleryItem[]) =>
  photos
    .map((photo, manualIndex) => ({ photo, manualIndex }))
    .sort((left, right) => {
      const leftCaptureTime = left.photo.captureInstant ? Date.parse(left.photo.captureInstant) : Number.NaN;
      const rightCaptureTime = right.photo.captureInstant ? Date.parse(right.photo.captureInstant) : Number.NaN;
      const leftIsDated = Number.isFinite(leftCaptureTime);
      const rightIsDated = Number.isFinite(rightCaptureTime);

      if (leftIsDated && rightIsDated) {
        return leftCaptureTime - rightCaptureTime || left.manualIndex - right.manualIndex;
      }
      if (leftIsDated) return -1;
      if (rightIsDated) return 1;
      return left.manualIndex - right.manualIndex;
    })
    .map(({ photo }) => photo);

export const HikeTripMedia = ({
  linkedTracks,
  photoMarkers,
  noteMarkers,
  startDate,
  endDate,
  photos,
  canViewFullPhotos,
  photoContributionCapability,
  trackHeaderAction,
}: {
  linkedTracks: LinkedTrack[];
  photoMarkers: HikePhotoMapMarker[];
  noteMarkers: HikeNoteMapMarker[];
  startDate: Date;
  endDate: Date;
  photos: HikePhotoGalleryItem[];
  canViewFullPhotos: boolean;
  photoContributionCapability?: HikePhotoContributionCapability | null;
  trackHeaderAction?: ReactNode;
}) => {
  const [focusCoordinate, setFocusCoordinate] = useState<HikePhotoAcceptedCoordinate | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mapSectionRef = useRef<HTMLElement>(null);
  const photoGalleryRef = useRef<HikePhotoGalleryHandle>(null);
  const days = useMemo(() => getHikeMapDays(startDate, endDate), [endDate, startDate]);
  const [selectedDay, setSelectedDay] = useState(ALL_DAYS);
  const hasMap = linkedTracks.some(({ map }) => map) || photoMarkers.length > 0 || noteMarkers.length > 0;
  const selectedPhotoId = searchParams.get("photo");
  const [photoOrder, setPhotoOrder] = useState<TripPhotoOrder>(() => parsePhotoOrder(searchParams.get("photoOrder")));
  const visibleLinkedTracks = useMemo(
    () =>
      selectedDay === ALL_DAYS ? linkedTracks : linkedTracks.filter(({ map }) => map?.dayKeys?.includes(selectedDay)),
    [linkedTracks, selectedDay],
  );
  const visibleTracks = useMemo(
    () => visibleLinkedTracks.flatMap(({ map }) => (map ? [map] : [])),
    [visibleLinkedTracks],
  );
  const visiblePhotoMarkers = useMemo(
    () =>
      selectedDay === ALL_DAYS ? photoMarkers : photoMarkers.filter(({ dayKeys }) => dayKeys?.includes(selectedDay)),
    [photoMarkers, selectedDay],
  );
  const visibleNoteMarkers = useMemo(
    () =>
      selectedDay === ALL_DAYS ? noteMarkers : noteMarkers.filter(({ dayKeys }) => dayKeys?.includes(selectedDay)),
    [noteMarkers, selectedDay],
  );
  const availableDayKeys = useMemo(
    () => [
      ...new Set([
        ...linkedTracks.flatMap(({ map }) => map?.dayKeys ?? []),
        ...photoMarkers.flatMap(({ dayKeys }) => dayKeys ?? []),
        ...noteMarkers.flatMap(({ dayKeys }) => dayKeys ?? []),
      ]),
    ],
    [linkedTracks, noteMarkers, photoMarkers],
  );
  const visiblePhotos = useMemo(
    () => (selectedDay === ALL_DAYS ? photos : photos.filter(({ dayKeys }) => dayKeys?.includes(selectedDay))),
    [photos, selectedDay],
  );
  const chronologicalPhotos = useMemo(() => getChronologicalPhotos(visiblePhotos), [visiblePhotos]);
  const orderedPhotos = photoOrder === "manual" ? visiblePhotos : chronologicalPhotos;
  const canChangePhotoOrder = chronologicalPhotos.some((photo, index) => photo.id !== visiblePhotos[index]?.id);

  useEffect(() => {
    setPhotoOrder(parsePhotoOrder(searchParams.get("photoOrder")));
  }, [searchParams]);

  useEffect(() => {
    if (!focusCoordinate) return;

    const frame = requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      mapSectionRef.current?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [focusCoordinate]);

  const focusMap = (coordinate: HikePhotoAcceptedCoordinate) => {
    // Copying preserves a distinct focus request when the same photo is selected again.
    setFocusCoordinate({ ...coordinate });
  };

  const selectMapPhoto = (photoId: string) => photoGalleryRef.current?.openPhotoById(photoId);

  const updateSelectedPhotoUrl = useCallback(
    (photoId: string | null) => {
      const currentSearchParams = new URLSearchParams(window.location.search);
      if (currentSearchParams.get("photo") === photoId) return;

      const nextSearchParams = new URLSearchParams(currentSearchParams);
      if (photoId) {
        nextSearchParams.set("photo", photoId);
      } else {
        nextSearchParams.delete("photo");
      }

      const query = nextSearchParams.toString();
      window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
    },
    [pathname],
  );

  const updatePhotoOrder = (nextPhotoOrder: TripPhotoOrder) => {
    if (nextPhotoOrder === photoOrder || !canChangePhotoOrder) return;

    const nextSearchParams = new URLSearchParams(window.location.search);
    if (nextPhotoOrder === "manual") {
      nextSearchParams.set("photoOrder", nextPhotoOrder);
    } else {
      nextSearchParams.delete("photoOrder");
    }

    const query = nextSearchParams.toString();
    window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
    setPhotoOrder(nextPhotoOrder);
  };

  useEffect(() => {
    if (!selectedPhotoId) {
      photoGalleryRef.current?.closeViewer();
      return;
    }

    if (!orderedPhotos.some((photo) => photo.id === selectedPhotoId)) {
      photoGalleryRef.current?.closeViewer();
      return;
    }

    photoGalleryRef.current?.openPhotoById(selectedPhotoId);
  }, [orderedPhotos, selectedPhotoId]);

  return (
    <>
      {hasMap ? (
        <section
          ref={mapSectionRef}
          tabIndex={-1}
          aria-labelledby="trip-route-map-heading"
          className="grid gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <h2 id="trip-route-map-heading" className="text-base font-semibold">
            Route map
          </h2>
          <HikeTrackMap
            tracks={visibleTracks}
            photoMarkers={visiblePhotoMarkers}
            noteMarkers={visibleNoteMarkers}
            days={days}
            availableDayKeys={availableDayKeys}
            selectedDay={selectedDay}
            onSelectedDayChange={setSelectedDay}
            focusCoordinate={focusCoordinate}
            onSelectPhoto={selectMapPhoto}
          />
        </section>
      ) : null}
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Linked tracks</h2>
          {trackHeaderAction}
        </div>
        {visibleLinkedTracks.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {visibleLinkedTracks.map((track) => (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            {selectedDay === ALL_DAYS
              ? "No tracks linked to this trip yet."
              : "No confidently dated tracks are available for this day."}
          </p>
        )}
      </section>
      <HikePhotoGallery
        photos={orderedPhotos}
        canViewFullPhotos={canViewFullPhotos}
        canFocusMap={hasMap}
        onFocusMap={focusMap}
        onSelectedPhotoChange={updateSelectedPhotoUrl}
        photoOrder={photoOrder}
        canChangePhotoOrder={canChangePhotoOrder}
        onPhotoOrderChange={updatePhotoOrder}
        ref={photoGalleryRef}
        photoContributionCapability={photoContributionCapability}
      />
    </>
  );
};

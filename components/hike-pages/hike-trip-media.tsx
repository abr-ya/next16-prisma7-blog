"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type { HikePhotoAcceptedCoordinate, HikePhotoContributionCapability } from "@/app/_data/hikes";
import {
  HikePhotoGallery,
  type HikePhotoGalleryHandle,
  type HikePhotoGalleryItem,
} from "@/components/hike-pages/hike-photo-gallery";
import { HikeTrackMap } from "@/components/hike-pages/hike-track-map";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { HikePhotoMapMarker } from "@/lib/hikes";
import { getHikeMapDays } from "@/lib/hike-map-days";
import type { TrackMapViewModel } from "@/lib/track-gpx-metadata";

export type TripPhotoOrder = "capture" | "manual";

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
  tracks,
  photoMarkers,
  noteMarkers,
  startDate,
  endDate,
  photos,
  canViewFullPhotos,
  photoContributionCapability,
}: {
  tracks: TrackMapViewModel[];
  photoMarkers: HikePhotoMapMarker[];
  noteMarkers: HikeNoteMapMarker[];
  startDate: Date;
  endDate: Date;
  photos: HikePhotoGalleryItem[];
  canViewFullPhotos: boolean;
  photoContributionCapability?: HikePhotoContributionCapability | null;
}) => {
  const [focusCoordinate, setFocusCoordinate] = useState<HikePhotoAcceptedCoordinate | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mapSectionRef = useRef<HTMLElement>(null);
  const photoGalleryRef = useRef<HikePhotoGalleryHandle>(null);
  const hasMap = tracks.length > 0 || photoMarkers.length > 0 || noteMarkers.length > 0;
  const selectedPhotoId = searchParams.get("photo");
  const [photoOrder, setPhotoOrder] = useState<TripPhotoOrder>(() => parsePhotoOrder(searchParams.get("photoOrder")));
  const chronologicalPhotos = useMemo(() => getChronologicalPhotos(photos), [photos]);
  const orderedPhotos = photoOrder === "manual" ? photos : chronologicalPhotos;
  const canChangePhotoOrder = chronologicalPhotos.some((photo, index) => photo.id !== photos[index]?.id);

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

    if (!orderedPhotos.some((photo) => photo.id === selectedPhotoId)) return;

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
            tracks={tracks}
            photoMarkers={photoMarkers}
            noteMarkers={noteMarkers}
            days={getHikeMapDays(startDate, endDate)}
            focusCoordinate={focusCoordinate}
            onSelectPhoto={selectMapPhoto}
          />
        </section>
      ) : null}
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

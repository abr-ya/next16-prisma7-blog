"use client";

import { useEffect, useRef, useState } from "react";

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
  const mapSectionRef = useRef<HTMLElement>(null);
  const photoGalleryRef = useRef<HikePhotoGalleryHandle>(null);
  const hasMap = tracks.length > 0 || photoMarkers.length > 0 || noteMarkers.length > 0;

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
        photos={photos}
        canViewFullPhotos={canViewFullPhotos}
        canFocusMap={hasMap}
        onFocusMap={focusMap}
        ref={photoGalleryRef}
        photoContributionCapability={photoContributionCapability}
      />
    </>
  );
};

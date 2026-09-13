"use client";

import { useState } from "react";

import type { HikePhotoAcceptedCoordinate, HikePhotoContributionCapability } from "@/app/_data/hikes";
import { HikePhotoGallery, type HikePhotoGalleryItem } from "@/components/hike-pages/hike-photo-gallery";
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
  const hasMap = tracks.length > 0 || photoMarkers.length > 0 || noteMarkers.length > 0;

  return (
    <>
      {hasMap ? (
        <section className="grid gap-3">
          <h2 className="text-base font-semibold">Route map</h2>
          <HikeTrackMap
            tracks={tracks}
            photoMarkers={photoMarkers}
            noteMarkers={noteMarkers}
            days={getHikeMapDays(startDate, endDate)}
            focusCoordinate={focusCoordinate}
          />
        </section>
      ) : null}
      <HikePhotoGallery
        photos={photos}
        canViewFullPhotos={canViewFullPhotos}
        canFocusMap={hasMap}
        onFocusMap={setFocusCoordinate}
        photoContributionCapability={photoContributionCapability}
      />
    </>
  );
};

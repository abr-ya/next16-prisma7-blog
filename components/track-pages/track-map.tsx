"use client";

import dynamic from "next/dynamic";

import type { HikePhotoMapMarker } from "@/lib/hikes";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { TrackMapViewModel } from "@/lib/track-gpx-metadata";

export type { TrackMapViewModel };

const TrackMapLeaflet = dynamic(() => import("@/components/track-pages/track-map-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] min-h-[360px] items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground sm:h-[440px] sm:min-h-[440px]">
      Loading map...
    </div>
  ),
});

export const TrackMap = ({ track }: { track: TrackMapViewModel }) => (
  <TrackMapLeaflet ariaLabel={`${track.title} route map`} tracks={[track]} />
);

export const CombinedTrackMap = ({
  tracks,
  ariaLabel,
  photoMarkers = [],
  noteMarkers = [],
  focusCoordinate,
  previewCoordinate,
  containerClassName,
}: {
  tracks: TrackMapViewModel[];
  ariaLabel: string;
  photoMarkers?: HikePhotoMapMarker[];
  noteMarkers?: HikeNoteMapMarker[];
  focusCoordinate?: { lat: number; lng: number } | null;
  previewCoordinate?: { lat: number; lng: number } | null;
  containerClassName?: string;
}) => (
  <TrackMapLeaflet
    ariaLabel={ariaLabel}
    tracks={tracks}
    photoMarkers={photoMarkers}
    noteMarkers={noteMarkers}
    focusCoordinate={focusCoordinate}
    previewCoordinate={previewCoordinate}
    containerClassName={containerClassName}
  />
);

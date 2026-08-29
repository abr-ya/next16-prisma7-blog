"use client";

import dynamic from "next/dynamic";

import type { TrackGpxBounds, TrackGpxCoordinate } from "@/lib/track-gpx-metadata";

export type TrackMapViewModel = {
  title: string;
  bounds: TrackGpxBounds;
  geometry: TrackGpxCoordinate[];
};

const TrackMapLeaflet = dynamic(() => import("@/components/track-pages/track-map-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] min-h-[360px] items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground sm:h-[440px] sm:min-h-[440px]">
      Loading map...
    </div>
  ),
});

export const TrackMap = ({ track }: { track: TrackMapViewModel }) => <TrackMapLeaflet track={track} />;

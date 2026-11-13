"use client";

import dynamic from "next/dynamic";

import type { TrackEditorMapPoint } from "@/components/track-pages/track-editor-map";

/**
 * feature-148: the saved-place form drops exactly one coordinate, so the
 * editor map is wrapped instead of extended: a click replaces the single
 * point and a dragged marker moves it. The map is lazy-loaded for the same
 * reason as `components/track-pages/track-editor.tsx` — Leaflet touches
 * `window` during module init, so it cannot render on the server.
 */
const TrackEditorMap = dynamic(() => import("@/components/track-pages/track-editor-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-125 min-h-125 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground sm:h-150 sm:min-h-150">
      Loading map...
    </div>
  ),
});

export type FavoritePlaceMapProps = {
  point: TrackEditorMapPoint | null;
  onChangePoint: (point: TrackEditorMapPoint) => void;
  ariaLabel: string;
};

export const FavoritePlaceMap = ({ point, onChangePoint, ariaLabel }: FavoritePlaceMapProps) => (
  <TrackEditorMap
    points={point ? [point] : []}
    onAddPoint={onChangePoint}
    onMovePoint={(_index, nextPoint) => onChangePoint(nextPoint)}
    onSelectPoint={() => undefined}
    selectedIndex={point ? 0 : null}
    ariaLabel={ariaLabel}
  />
);

export default FavoritePlaceMap;

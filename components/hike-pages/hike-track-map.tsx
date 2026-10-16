"use client";

import type { TrackStatus } from "@/generated/prisma/enums";

import { CombinedTrackMap, type TrackMapViewModel } from "@/components/track-pages/track-map";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HikeMapDay } from "@/lib/hike-map-days";
import type { HikePhotoMapMarker } from "@/lib/hikes";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { HikePhotoAcceptedCoordinate } from "@/app/_data/hikes";

const ALL_DAYS = "all";

export const HikeTrackMap = ({
  tracks,
  trackStatuses,
  photoMarkers = [],
  noteMarkers = [],
  days,
  availableDayKeys,
  selectedDay,
  onSelectedDayChange,
  focusCoordinate,
  onSelectPhoto,
}: {
  tracks: TrackMapViewModel[];
  // Lockstep with `tracks`; lets the map render DRAFT polylines / markers with
  // a muted style (per the owner-visible DRAFT tracks rule in
  // `outdoor-hike-media-map`). Undefined / shorter than `tracks` is treated
  // as `PUBLISHED` for any track without a matching entry.
  trackStatuses?: TrackStatus[];
  photoMarkers?: HikePhotoMapMarker[];
  noteMarkers?: HikeNoteMapMarker[];
  days: HikeMapDay[];
  availableDayKeys: string[];
  selectedDay: string;
  onSelectedDayChange: (day: string) => void;
  focusCoordinate?: HikePhotoAcceptedCoordinate | null;
  onSelectPhoto?: (photoId: string) => void;
}) => {
  const isSingleDay = days.length <= 1;
  const isEmptySelection =
    selectedDay !== ALL_DAYS && tracks.length === 0 && photoMarkers.length === 0 && noteMarkers.length === 0;

  return (
    <div className="grid gap-2">
      {!isSingleDay ? (
        <div className="flex justify-end">
          <Select value={selectedDay} onValueChange={onSelectedDayChange}>
            <SelectTrigger aria-label="Map day" size="sm">
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value={ALL_DAYS}>All days</SelectItem>
              {days.map((day, index) => {
                const hasLayers = availableDayKeys.includes(day.key);

                return (
                  <SelectItem key={day.key} value={day.key} disabled={!hasLayers}>
                    {`Day ${index + 1} — ${day.label}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {isEmptySelection ? (
        <div className="flex h-90 min-h-90 items-center justify-center rounded-md border bg-muted px-6 text-center text-sm text-muted-foreground sm:h-110 sm:min-h-110">
          No confidently dated map layers are available for this day.
        </div>
      ) : (
        <CombinedTrackMap
          ariaLabel="Trip route map"
          tracks={tracks}
          trackStatuses={trackStatuses}
          photoMarkers={photoMarkers}
          noteMarkers={noteMarkers}
          focusCoordinate={focusCoordinate}
          onSelectPhoto={onSelectPhoto}
        />
      )}
    </div>
  );
};

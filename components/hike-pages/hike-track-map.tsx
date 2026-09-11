"use client";

import { useState } from "react";

import { CombinedTrackMap, type TrackMapViewModel } from "@/components/track-pages/track-map";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HikeMapDay } from "@/lib/hike-map-days";
import type { HikePhotoMapMarker } from "@/lib/hikes";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { HikePhotoAcceptedCoordinate } from "@/app/_data/hikes";

const ALL_DAYS = "all";

export const HikeTrackMap = ({
  tracks,
  photoMarkers = [],
  noteMarkers = [],
  days,
  focusCoordinate,
}: {
  tracks: TrackMapViewModel[];
  photoMarkers?: HikePhotoMapMarker[];
  noteMarkers?: HikeNoteMapMarker[];
  days: HikeMapDay[];
  focusCoordinate?: HikePhotoAcceptedCoordinate | null;
}) => {
  const [selectedDay, setSelectedDay] = useState(ALL_DAYS);
  const effectiveSelectedDay = focusCoordinate ? ALL_DAYS : selectedDay;
  const isSingleDay = days.length <= 1;
  const visibleTracks =
    effectiveSelectedDay === ALL_DAYS
      ? tracks
      : tracks.filter((track) => track.dayKeys?.includes(effectiveSelectedDay));
  const visiblePhotoMarkers =
    effectiveSelectedDay === ALL_DAYS
      ? photoMarkers
      : photoMarkers.filter((marker) => marker.dayKeys?.includes(effectiveSelectedDay));
  const visibleNoteMarkers =
    effectiveSelectedDay === ALL_DAYS
      ? noteMarkers
      : noteMarkers.filter((marker) => marker.dayKeys?.includes(effectiveSelectedDay));
  const isEmptySelection =
    effectiveSelectedDay !== ALL_DAYS &&
    visibleTracks.length === 0 &&
    visiblePhotoMarkers.length === 0 &&
    visibleNoteMarkers.length === 0;

  return (
    <div className="grid gap-2">
      {!isSingleDay ? (
        <div className="flex justify-end">
          <Select value={effectiveSelectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger aria-label="Map day" size="sm">
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent position="popper" align="end" className="z-[1000]">
              <SelectItem value={ALL_DAYS}>All days</SelectItem>
              {days.map((day, index) => {
                const hasLayers =
                  tracks.some((track) => track.dayKeys?.includes(day.key)) ||
                  photoMarkers.some((marker) => marker.dayKeys?.includes(day.key)) ||
                  noteMarkers.some((marker) => marker.dayKeys?.includes(day.key));

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
          tracks={visibleTracks}
          photoMarkers={visiblePhotoMarkers}
          noteMarkers={visibleNoteMarkers}
          focusCoordinate={focusCoordinate}
        />
      )}
    </div>
  );
};

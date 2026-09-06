"use client";

import { useState } from "react";

import { CombinedTrackMap, type TrackMapViewModel } from "@/components/track-pages/track-map";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HikeMapDay } from "@/lib/hike-map-days";
import type { HikePhotoMapMarker } from "@/lib/hikes";

const ALL_DAYS = "all";

export const HikeTrackMap = ({
  tracks,
  photoMarkers = [],
  days,
}: {
  tracks: TrackMapViewModel[];
  photoMarkers?: HikePhotoMapMarker[];
  days: HikeMapDay[];
}) => {
  const [selectedDay, setSelectedDay] = useState(ALL_DAYS);
  const isSingleDay = days.length <= 1;
  const visibleTracks =
    selectedDay === ALL_DAYS ? tracks : tracks.filter((track) => track.dayKeys?.includes(selectedDay));
  const visiblePhotoMarkers =
    selectedDay === ALL_DAYS ? photoMarkers : photoMarkers.filter((marker) => marker.dayKeys?.includes(selectedDay));
  const isEmptySelection = selectedDay !== ALL_DAYS && visibleTracks.length === 0 && visiblePhotoMarkers.length === 0;

  return (
    <div className="grid gap-2">
      {!isSingleDay ? (
        <div className="flex justify-end">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger aria-label="Map day" size="sm">
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent position="popper" align="end" className="z-[1000]">
              <SelectItem value={ALL_DAYS}>All days</SelectItem>
              {days.map((day, index) => {
                const hasLayers =
                  tracks.some((track) => track.dayKeys?.includes(day.key)) ||
                  photoMarkers.some((marker) => marker.dayKeys?.includes(day.key));

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
        <CombinedTrackMap ariaLabel="Hike route map" tracks={visibleTracks} photoMarkers={visiblePhotoMarkers} />
      )}
    </div>
  );
};

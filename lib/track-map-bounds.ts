"use client";

import { type LatLngBoundsExpression } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

import type { HikePhotoMapMarker } from "@/lib/hikes";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { TrackMapViewModel } from "@/lib/track-gpx-metadata";

type MapPoint = { lat: number; lng: number };

const toLatLng = (point: MapPoint): [number, number] => [point.lat, point.lng];

const toBoundsFromPoints = (points: MapPoint[]): LatLngBoundsExpression => [
  [Math.min(...points.map((point) => point.lat)), Math.min(...points.map((point) => point.lng))],
  [Math.max(...points.map((point) => point.lat)), Math.max(...points.map((point) => point.lng))],
];

const collectMapPoints = (
  tracks: TrackMapViewModel[],
  photoMarkers: HikePhotoMapMarker[],
  noteMarkers: HikeNoteMapMarker[],
): MapPoint[] => [
  ...tracks.flatMap((track) => track.geometry),
  ...photoMarkers.map((marker) => ({ lat: marker.lat, lng: marker.lng })),
  ...noteMarkers.map((marker) => ({ lat: marker.lat, lng: marker.lng })),
];

/**
 * Read-only Leaflet `useMap`-driven effect that fits the map to the union of
 * all rendered track, photo, and note markers. Extracted from the read-only
 * map in feature-111 so the new `TrackEditorMap` (write-side, click-to-add)
 * can reuse the same initial-fit behaviour without duplicating the math or
 * pulling in the read-only renderer's photo/note marker layer.
 */
export const FitTrackMapBounds = ({
  tracks,
  photoMarkers = [],
  noteMarkers = [],
}: {
  tracks: TrackMapViewModel[];
  photoMarkers?: HikePhotoMapMarker[];
  noteMarkers?: HikeNoteMapMarker[];
}) => {
  const map = useMap();

  useEffect(() => {
    const points = collectMapPoints(tracks, photoMarkers, noteMarkers);

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(toLatLng(points[0]), 13);
      return;
    }

    map.fitBounds(toBoundsFromPoints(points), { padding: [28, 28], maxZoom: 15 });
  }, [map, noteMarkers, photoMarkers, tracks]);

  return null;
};

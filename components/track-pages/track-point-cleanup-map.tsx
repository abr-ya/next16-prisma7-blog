"use client";

import type { LatLngBoundsExpression } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer } from "react-leaflet";

import type { TrackPointEditorPoint } from "@/lib/track-gpx-edit";
import type { TrackGpxBounds } from "@/lib/track-gpx-metadata";

const TRACK_LINE_COLOR = "#0f766e";
const DEFAULT_POINT_COLOR = "#0f766e";
const SELECTED_POINT_COLOR = "#ea580c";

const toLatLng = (point: TrackPointEditorPoint): [number, number] => [point.lat, point.lng];

const toBounds = (bounds: TrackGpxBounds): LatLngBoundsExpression => [
  [bounds.south, bounds.west],
  [bounds.north, bounds.east],
];

export const TrackPointCleanupMap = ({
  points,
  bounds,
  isSelected,
  onSelectPoint,
}: {
  points: TrackPointEditorPoint[];
  bounds: TrackGpxBounds;
  isSelected: (index: number) => boolean;
  onSelectPoint: (index: number) => void;
}) => (
  <MapContainer bounds={toBounds(bounds)} scrollWheelZoom preferCanvas className="h-full w-full" attributionControl>
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <Polyline positions={points.map(toLatLng)} pathOptions={{ color: TRACK_LINE_COLOR, weight: 3 }} />
    {points.map((point) => (
      <CircleMarker
        key={`${point.index}-${point.lat}-${point.lng}`}
        center={toLatLng(point)}
        radius={isSelected(point.index) ? 6 : 3}
        pathOptions={{
          color: isSelected(point.index) ? SELECTED_POINT_COLOR : DEFAULT_POINT_COLOR,
          fillColor: isSelected(point.index) ? SELECTED_POINT_COLOR : DEFAULT_POINT_COLOR,
          fillOpacity: isSelected(point.index) ? 1 : 0.7,
          weight: 2,
        }}
        eventHandlers={{ click: () => onSelectPoint(point.index) }}
      />
    ))}
  </MapContainer>
);

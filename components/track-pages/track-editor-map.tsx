"use client";

import { type LatLngBoundsExpression } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMapEvents } from "react-leaflet";

import { FitTrackMapBounds } from "@/lib/track-map-bounds";
import type { TrackGpxCoordinate } from "@/lib/track-gpx-metadata";

export type TrackEditorMapPoint = TrackGpxCoordinate;

const TRACK_LINE_COLORS = ["#0f766e", "#0369a1", "#7c3aed", "#c2410c", "#15803d", "#a21caf", "#b45309", "#0e7490"];

const toLatLng = (point: TrackEditorMapPoint): [number, number] => [point.lat, point.lng];

const toBoundsFromPoints = (points: TrackEditorMapPoint[]): LatLngBoundsExpression => [
  [Math.min(...points.map((point) => point.lat)), Math.min(...points.map((point) => point.lng))],
  [Math.max(...points.map((point) => point.lat)), Math.max(...points.map((point) => point.lng))],
];

const ClickToAdd = ({ onAddPoint }: { onAddPoint: (point: TrackEditorMapPoint) => void }) => {
  useMapEvents({
    click(event) {
      onAddPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
};

export const TrackEditorMap = ({
  points,
  onAddPoint,
  ariaLabel,
}: {
  points: TrackEditorMapPoint[];
  onAddPoint: (point: TrackEditorMapPoint) => void;
  ariaLabel: string;
}) => {
  const positions = points.map(toLatLng);
  const hasExtent = points.length >= 2;
  const bounds = hasExtent ? toBoundsFromPoints(points) : undefined;
  const firstPoint = points[0];

  return (
    <div className="h-90 min-h-90 overflow-hidden rounded-md border bg-muted sm:h-110 sm:min-h-110">
      <MapContainer
        aria-label={ariaLabel}
        bounds={bounds}
        center={!hasExtent && firstPoint ? toLatLng(firstPoint) : undefined}
        zoom={!hasExtent && firstPoint ? 13 : undefined}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrackMapBounds tracks={[]} />
        <ClickToAdd onAddPoint={onAddPoint} />
        {positions.length >= 2 ? (
          <Polyline pathOptions={{ color: TRACK_LINE_COLORS[0], weight: 4, dashArray: "6 6" }} positions={positions} />
        ) : null}
        {points.map((point, index) => (
          <CircleMarker
            key={`editor-point-${index}`}
            center={toLatLng(point)}
            pathOptions={{
              color: TRACK_LINE_COLORS[0],
              fillColor: TRACK_LINE_COLORS[0],
              fillOpacity: 0.9,
            }}
            radius={6}
          />
        ))}
      </MapContainer>
    </div>
  );
};

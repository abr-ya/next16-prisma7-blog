"use client";

import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import type { TrackMapViewModel } from "@/components/track-pages/track-map";

const TRACK_LINE_COLOR = "#0f766e";
const START_COLOR = "#16a34a";
const END_COLOR = "#dc2626";

const createEndpointIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    html: `<span aria-hidden="true" style="display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:${color};color:white;border:2px solid white;box-shadow:0 2px 8px rgb(15 23 42 / 0.35);font:700 12px/1 system-ui,sans-serif;">${label}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const startIcon = createEndpointIcon("S", START_COLOR);
const endIcon = createEndpointIcon("E", END_COLOR);

const toLatLng = (point: TrackMapViewModel["geometry"][number]): LatLngExpression => [point.lat, point.lng];

const toBounds = (track: TrackMapViewModel): LatLngBoundsExpression => [
  [track.bounds.south, track.bounds.west],
  [track.bounds.north, track.bounds.east],
];

const FitTrackBounds = ({ track }: { track: TrackMapViewModel }) => {
  const map = useMap();

  useEffect(() => {
    if (track.geometry.length === 1) {
      map.setView(toLatLng(track.geometry[0]), 13);
    } else {
      map.fitBounds(toBounds(track), { padding: [28, 28], maxZoom: 15 });
    }
  }, [map, track]);

  return null;
};

const TrackMapLeaflet = ({ track }: { track: TrackMapViewModel }) => {
  const positions = track.geometry.map(toLatLng);
  const first = track.geometry[0];
  const last = track.geometry[track.geometry.length - 1];
  const hasRoute = positions.length >= 2;

  return (
    <div className="h-90 min-h-90 overflow-hidden rounded-md border bg-muted sm:h-110 sm:min-h-110">
      <MapContainer
        aria-label={`${track.title} route map`}
        bounds={hasRoute ? toBounds(track) : undefined}
        center={!hasRoute ? toLatLng(first) : undefined}
        zoom={!hasRoute ? 13 : undefined}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrackBounds track={track} />
        {hasRoute ? <Polyline pathOptions={{ color: TRACK_LINE_COLOR, weight: 4 }} positions={positions} /> : null}
        {first ? <Marker icon={startIcon} position={toLatLng(first)} title="Start" /> : null}
        {hasRoute && last ? <Marker icon={endIcon} position={toLatLng(last)} title="End" /> : null}
        {!hasRoute && first ? (
          <CircleMarker
            center={toLatLng(first)}
            pathOptions={{ color: START_COLOR, fillColor: START_COLOR, fillOpacity: 0.8 }}
            radius={8}
          />
        ) : null}
      </MapContainer>
    </div>
  );
};

export default TrackMapLeaflet;

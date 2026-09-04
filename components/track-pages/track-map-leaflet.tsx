"use client";

import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

import type { TrackMapViewModel } from "@/lib/track-gpx-metadata";

const TRACK_LINE_COLORS = ["#0f766e", "#0369a1", "#7c3aed", "#c2410c", "#15803d", "#a21caf", "#b45309", "#0e7490"];
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

const toCombinedBounds = (tracks: TrackMapViewModel[]): LatLngBoundsExpression => [
  [Math.min(...tracks.map((track) => track.bounds.south)), Math.min(...tracks.map((track) => track.bounds.west))],
  [Math.max(...tracks.map((track) => track.bounds.north)), Math.max(...tracks.map((track) => track.bounds.east))],
];

const FitTrackBounds = ({ tracks }: { tracks: TrackMapViewModel[] }) => {
  const map = useMap();

  useEffect(() => {
    const points = tracks.flatMap((track) => track.geometry);

    if (points.length === 1) {
      map.setView(toLatLng(points[0]), 13);
      return;
    }

    map.fitBounds(toCombinedBounds(tracks), { padding: [28, 28], maxZoom: 15 });
  }, [map, tracks]);

  return null;
};

const TrackMapLeaflet = ({ ariaLabel, tracks }: { ariaLabel: string; tracks: TrackMapViewModel[] }) => {
  if (tracks.length === 0) return null;

  const points = tracks.flatMap((track) => track.geometry);
  const first = points[0];
  const hasExtent = points.length >= 2;
  const singleTrack = tracks.length === 1 ? tracks[0] : null;
  const singleTrackPositions = singleTrack?.geometry.map(toLatLng) ?? [];
  const singleHasRoute = singleTrackPositions.length >= 2;
  const singleFirst = singleTrack?.geometry[0];
  const singleLast = singleTrack?.geometry.at(-1);

  return (
    <div className="h-90 min-h-90 overflow-hidden rounded-md border bg-muted sm:h-110 sm:min-h-110">
      <MapContainer
        aria-label={ariaLabel}
        bounds={hasExtent ? toCombinedBounds(tracks) : undefined}
        center={!hasExtent && first ? toLatLng(first) : undefined}
        zoom={!hasExtent && first ? 13 : undefined}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrackBounds tracks={tracks} />
        {tracks.map((track, index) => {
          const positions = track.geometry.map(toLatLng);

          if (positions.length < 2) return null;

          return (
            <Polyline
              key={`${track.title}-${index}`}
              pathOptions={{ color: TRACK_LINE_COLORS[index % TRACK_LINE_COLORS.length], weight: 4 }}
              positions={positions}
            >
              {tracks.length > 1 ? <Tooltip sticky>{track.title}</Tooltip> : null}
            </Polyline>
          );
        })}
        {singleTrack && singleFirst ? <Marker icon={startIcon} position={toLatLng(singleFirst)} title="Start" /> : null}
        {singleTrack && singleHasRoute && singleLast ? (
          <Marker icon={endIcon} position={toLatLng(singleLast)} title="End" />
        ) : null}
        {singleTrack && !singleHasRoute && singleFirst ? (
          <CircleMarker
            center={toLatLng(singleFirst)}
            pathOptions={{ color: START_COLOR, fillColor: START_COLOR, fillOpacity: 0.8 }}
            radius={8}
          />
        ) : null}
      </MapContainer>
    </div>
  );
};

export default TrackMapLeaflet;

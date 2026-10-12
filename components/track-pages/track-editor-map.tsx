"use client";

import { Crosshair, Loader2 } from "lucide-react";
import { type LatLngBoundsExpression } from "leaflet";
import { useT } from "next-i18next/client";
import { useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { toast } from "sonner";

import { tripsNamespace } from "@/app/i18n/settings";
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

const LocateButton = () => {
  const { t } = useT(tripsNamespace);
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("trackEditorGeolocationUnavailable"));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], 13);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? t("trackEditorGeolocationDenied")
            : t("trackEditorGeolocationFailed");
        toast.error(message);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={locating}
      aria-label={t("trackEditorLocate")}
      title={t("trackEditorLocate")}
      className="absolute top-2 right-2 z-1000 inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
    >
      {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
    </button>
  );
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
    <div className="relative h-125 min-h-125 overflow-hidden rounded-md border bg-muted sm:h-150 sm:min-h-150">
      <MapContainer
        aria-label={ariaLabel}
        bounds={bounds}
        center={!hasExtent && firstPoint ? toLatLng(firstPoint) : [0, 0]}
        zoom={!hasExtent && firstPoint ? 13 : 2}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrackMapBounds tracks={[]} />
        <LocateButton />
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

export default TrackEditorMap;

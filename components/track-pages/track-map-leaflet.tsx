"use client";

import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

import type { TrackStatus } from "@/generated/prisma/enums";
import type { HikePhotoMapMarker } from "@/lib/hikes";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import { groupHikePhotoMapMarkers } from "@/lib/hike-map-markers";
import { FitTrackMapBounds } from "@/lib/track-map-bounds";
import type { TrackMapViewModel } from "@/lib/track-gpx-metadata";

const TRACK_LINE_COLORS = ["#0f766e", "#0369a1", "#7c3aed", "#c2410c", "#15803d", "#a21caf", "#b45309", "#0e7490"];
// feature-150: the recorded trace beside the primary route. A fixed blue keeps
// "recording" distinct from the route's teal regardless of array position.
const SECONDARY_TRACK_COLOR = "#0369a1";
const SECONDARY_TRACK_DASH = "6 6";
const START_COLOR = "#16a34a";
const END_COLOR = "#dc2626";
const PHOTO_MARKER_COLOR = "#d97706";
const NOTE_MARKER_COLOR = "#2563eb";
const PREVIEW_MARKER_COLOR = "#7c3aed";
// Owner-visible DRAFT tracks on the trip map (per `outdoor-hike-media-map`):
// muted slate palette, thinner dashed stroke, slate endpoint markers so the
// owner can distinguish "preview" from "real" without losing orientation.
const DRAFT_TRACK_COLOR = "#94a3b8";
const DRAFT_START_COLOR = "#64748b";
const DRAFT_END_COLOR = "#94a3b8";

const createEndpointIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    html: `<span aria-hidden="true" style="display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:${color};color:white;border:2px solid white;box-shadow:0 2px 8px rgb(15 23 42 / 0.35);font:700 12px/1 system-ui,sans-serif;">${label}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const startIcon = createEndpointIcon("S", START_COLOR);
const endIcon = createEndpointIcon("E", END_COLOR);
const photoIcon = createEndpointIcon("P", PHOTO_MARKER_COLOR);
const noteIcon = createEndpointIcon("N", NOTE_MARKER_COLOR);
const createPhotoGroupIcon = (count: number) => createEndpointIcon(String(count), PHOTO_MARKER_COLOR);
// DRAFT counterparts: muted slate start/end markers for owner-visible DRAFT
// tracks on the trip map. Same "S" / "E" labels so orientation is preserved.
const draftStartIcon = createEndpointIcon("S", DRAFT_START_COLOR);
const draftEndIcon = createEndpointIcon("E", DRAFT_END_COLOR);

type MapPoint = { lat: number; lng: number };

const toLatLng = (point: MapPoint): LatLngExpression => [point.lat, point.lng];

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

const getTrackLinePathOptions = (
  track: TrackMapViewModel,
  index: number,
  isDraft: boolean,
): { color: string; weight: number; dashArray?: string } => {
  if (isDraft) return { color: DRAFT_TRACK_COLOR, weight: 2, dashArray: "4 6" };
  if (track.style === "secondary") {
    return { color: SECONDARY_TRACK_COLOR, weight: 2, dashArray: SECONDARY_TRACK_DASH };
  }
  return { color: TRACK_LINE_COLORS[index % TRACK_LINE_COLORS.length], weight: 4 };
};

const FocusMapCoordinate = ({ coordinate }: { coordinate?: MapPoint | null }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinate) map.flyTo(toLatLng(coordinate), Math.max(map.getZoom(), 15));
  }, [coordinate, map]);

  return null;
};

const TrackMapLeaflet = ({
  ariaLabel,
  tracks,
  trackStatuses,
  photoMarkers = [],
  noteMarkers = [],
  focusCoordinate,
  previewCoordinate,
  containerClassName,
  showLegend = false,
  onSelectPhoto,
}: {
  ariaLabel: string;
  tracks: TrackMapViewModel[];
  // Lockstep with `tracks`; lets the map render DRAFT polylines / markers with
  // a muted style (per the owner-visible DRAFT tracks rule in
  // `outdoor-hike-media-map`). Undefined / shorter than `tracks` is treated
  // as `PUBLISHED` for any track without a matching entry.
  trackStatuses?: TrackStatus[];
  photoMarkers?: HikePhotoMapMarker[];
  noteMarkers?: HikeNoteMapMarker[];
  focusCoordinate?: MapPoint | null;
  previewCoordinate?: MapPoint | null;
  containerClassName?: string;
  showLegend?: boolean;
  onSelectPhoto?: (photoId: string) => void;
}) => {
  const points = collectMapPoints(tracks, photoMarkers, noteMarkers);
  const photoMarkerGroups = groupHikePhotoMapMarkers(photoMarkers);

  if (points.length === 0) return null;

  const first = points[0];
  const hasExtent = points.length >= 2;
  const hasSecondary = tracks.some((track) => track.style === "secondary");
  // feature-150: with a secondary recording present, the first non-secondary
  // line keeps the S/E markers so the route orientation survives. A lone track
  // behaves exactly as before, and a multi-track trip map still has none.
  const markerIndex =
    tracks.length === 1 ? 0 : hasSecondary ? tracks.findIndex((track) => track.style !== "secondary") : -1;
  const markerTrack = markerIndex >= 0 ? tracks[markerIndex] : null;
  const markerTrackIsDraft = markerTrack ? trackStatuses?.[markerIndex] === "DRAFT" : false;
  const markerPositions = markerTrack?.geometry.map(toLatLng) ?? [];
  const markerHasRoute = markerPositions.length >= 2;
  const markerFirst = markerTrack?.geometry[0];
  const markerLast = markerTrack?.geometry.at(-1);
  // Secondary lines draw underneath the primary route, so the route stays
  // visible where the two shapes overlap.
  const drawOrder = tracks
    .map((track, index) => ({ track, index }))
    .sort((a, b) => Number(b.track.style === "secondary") - Number(a.track.style === "secondary"));
  const legendItems = tracks
    .map((track, index) => ({
      // feature-160: a line may name its source instead of repeating the title.
      title: track.legendLabel ?? track.title,
      color: getTrackLinePathOptions(track, index, trackStatuses?.[index] === "DRAFT").color,
      drawable: track.geometry.length >= 2,
    }))
    .filter((item) => item.drawable);

  return (
    <div
      className={containerClassName ?? "h-90 min-h-90 overflow-hidden rounded-md border bg-muted sm:h-110 sm:min-h-110"}
    >
      <div className="relative h-full w-full">
        <MapContainer
          aria-label={ariaLabel}
          bounds={hasExtent ? toBoundsFromPoints(points) : undefined}
          center={!hasExtent && first ? toLatLng(first) : undefined}
          zoom={!hasExtent && first ? 13 : undefined}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitTrackMapBounds tracks={tracks} photoMarkers={photoMarkers} noteMarkers={noteMarkers} />
          <FocusMapCoordinate coordinate={focusCoordinate} />
          {drawOrder.map(({ track, index }) => {
            const positions = track.geometry.map(toLatLng);

            if (positions.length < 2) return null;

            const isDraft = trackStatuses?.[index] === "DRAFT";

            return (
              <Polyline
                key={`${track.title}-${index}`}
                pathOptions={getTrackLinePathOptions(track, index, isDraft)}
                positions={positions}
              >
                {tracks.length > 1 ? <Tooltip sticky>{track.title}</Tooltip> : null}
              </Polyline>
            );
          })}
          {markerTrack && markerFirst ? (
            <Marker
              icon={markerTrackIsDraft ? draftStartIcon : startIcon}
              position={toLatLng(markerFirst)}
              title="Start"
            />
          ) : null}
          {markerTrack && markerHasRoute && markerLast ? (
            <Marker icon={markerTrackIsDraft ? draftEndIcon : endIcon} position={toLatLng(markerLast)} title="End" />
          ) : null}
          {markerTrack && !markerHasRoute && markerFirst ? (
            <CircleMarker
              center={toLatLng(markerFirst)}
              pathOptions={
                markerTrackIsDraft
                  ? { color: DRAFT_START_COLOR, fillColor: DRAFT_START_COLOR, fillOpacity: 0.8 }
                  : { color: START_COLOR, fillColor: START_COLOR, fillOpacity: 0.8 }
              }
              radius={8}
            />
          ) : null}
          {previewCoordinate ? (
            <CircleMarker
              center={toLatLng(previewCoordinate)}
              pathOptions={{ color: PREVIEW_MARKER_COLOR, fillColor: PREVIEW_MARKER_COLOR, fillOpacity: 0.9 }}
              radius={8}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                Previewed location
              </Tooltip>
            </CircleMarker>
          ) : null}
          {photoMarkerGroups.map((group) => {
            if (group.photos.length > 1) {
              return (
                <Marker
                  key={`${group.lat},${group.lng}`}
                  icon={createPhotoGroupIcon(group.photos.length)}
                  position={toLatLng(group)}
                  title={`${group.photos.length} photos`}
                >
                  <Popup>
                    <div className="grid max-h-64 max-w-64 gap-2 overflow-y-auto pr-1">
                      {group.photos.map((marker) => (
                        <button
                          key={marker.photoId}
                          type="button"
                          className="grid grid-cols-[4rem_1fr] items-center gap-2 rounded-sm text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => onSelectPhoto?.(marker.photoId)}
                        >
                          {marker.thumbnailUrl ? (
                            <img src={marker.thumbnailUrl} alt="" className="h-16 w-16 rounded-sm object-cover" />
                          ) : (
                            <div aria-hidden="true" className="h-16 w-16 rounded-sm bg-muted" />
                          )}
                          <div className="text-xs font-medium leading-snug">{marker.title}</div>
                        </button>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              );
            }

            const marker = group.photos[0];

            return (
              <Marker
                key={marker.photoId}
                icon={photoIcon}
                position={toLatLng({ lat: marker.lat, lng: marker.lng })}
                title={marker.title}
                eventHandlers={{ click: () => onSelectPhoto?.(marker.photoId) }}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                  <div className="grid max-w-40 gap-1.5">
                    {marker.thumbnailUrl ? (
                      <img src={marker.thumbnailUrl} alt="" className="h-20 w-full rounded-sm object-cover" />
                    ) : null}
                    <div className="text-xs font-medium leading-snug">{marker.title}</div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
          {noteMarkers.map((marker) => (
            <Marker key={marker.noteId} icon={noteIcon} position={toLatLng(marker)} title={marker.title}>
              <Popup>
                <div className="grid max-w-64 gap-1">
                  <div className="text-sm font-medium">{marker.title}</div>
                  {marker.body ? (
                    <div className="whitespace-pre-wrap text-xs leading-relaxed">{marker.body}</div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        {showLegend && legendItems.length > 1 ? (
          <div className="pointer-events-none absolute right-2 top-2 z-[800] grid gap-1 rounded-md border bg-background/90 px-2 py-1.5 text-xs shadow-sm">
            {legendItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium leading-snug">{item.title}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TrackMapLeaflet;

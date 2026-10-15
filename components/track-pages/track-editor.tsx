"use client";

import { ArrowDown, ArrowUp, MapPin, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useT } from "next-i18next/client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { navigationNamespace } from "@/app/i18n/settings";
import { distanceBetweenPoints, EARTH_RADIUS_METERS } from "@/lib/track-gpx-parser";
import type { TrackGpxCoordinate } from "@/lib/track-gpx-metadata";
import { formatTrackDistance } from "@/lib/track-gpx-metadata";

/**
 * Lazy-loaded editor map. Mirrors the `ssr: false` pattern used by
 * `components/track-pages/track-map.tsx` for the read-only map because
 * Leaflet touches `window` during module init.
 */
const TrackEditorMap = dynamic(() => import("@/components/track-pages/track-editor-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-125 min-h-125 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground sm:h-150 sm:min-h-150">
      Loading map...
    </div>
  ),
});

export type ManualTrackPoint = { lat: number; lng: number };

/**
 * Returns `true` when the event target is a text-editing element
 * (`<input>`, `<textarea>`, `[contenteditable]`). Used by the editor's
 * Delete/Backspace handler to no-op when the user is typing in any of the
 * dialog's form fields.
 */
const isEditingText = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  return target.isContentEditable;
};

export type TrackEditorProps = {
  /**
   * Initial ordered points. Re-applied when the parent flips `resetKey`
   * (e.g. when the user re-opens the modal in a clean state). Mutating
   * `initialPoints` in place is not supported; pass a new array.
   */
  initialPoints?: ManualTrackPoint[];
  /**
   * Notified whenever the ordered point list changes. The editor's
   * internal state is the single source of truth for the list — the
   * parent should not retain its own copy.
   */
  onChangePoints: (points: ManualTrackPoint[]) => void;
  /**
   * Slot for the existing react-hook-form fields (title, slug, description,
   * status). Rendered once, above the map, so the map UI can claim the
   * full modal width below the form.
   */
  renderFormFields: () => ReactNode;
  /**
   * Forward-compat hook for a future `outdoor-track-point-deletion` slice:
   * the parent can render a "Save changes" submit button or extra editor
   * controls here. Not used by the MVP `Place on map` tab.
   */
  renderExtraActions?: () => ReactNode;
  /**
   * Optional accessibility label for the map, rendered as
   * `aria-label` on the Leaflet container.
   */
  mapAriaLabel?: string;
};

/**
 * Calculate the running total distance in meters for a list of placed
 * points using the same Haversine helper the server-side GPX metadata
 * pipeline uses (`distanceBetweenPoints`). Exported as a named helper so
 * task 3.4's distance-preview assertion can call it without touching
 * React state.
 */
export const computeEditorDistanceMeters = (points: TrackGpxCoordinate[]): number => {
  if (points.length < 2) return 0;

  let total = 0;

  for (let i = 1; i < points.length; i += 1) {
    total += distanceBetweenPoints(points[i - 1], points[i]);
  }

  return total;
};

/**
 * Self-contained reusable editor shell used by feature-111's `Place on map`
 * tab inside `TrackFormDialog` and (forward-compat) the future
 * `outdoor-track-point-deletion` slice. Owns the ordered point list, the
 * Leaflet map, the running distance preview, and the reorder/remove
 * affordances. The parent supplies the form-fields slot and a callback for
 * the latest point list.
 */
export const TrackEditor = ({
  initialPoints = [],
  onChangePoints,
  renderFormFields,
  renderExtraActions,
  mapAriaLabel,
}: TrackEditorProps) => {
  const { t } = useT(navigationNamespace);
  const [points, setPoints] = useState<ManualTrackPoint[]>(initialPoints);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const replacePoints = useCallback(
    (next: ManualTrackPoint[]) => {
      setPoints(next);
      onChangePoints(next);
    },
    [onChangePoints],
  );

  const handleAddPoint = useCallback(
    (point: ManualTrackPoint) => {
      replacePoints([...points, point]);
      setSelectedIndex(null);
    },
    [points, replacePoints],
  );

  const handleRemovePoint = useCallback(
    (index: number) => {
      replacePoints(points.filter((_, currentIndex) => currentIndex !== index));
      // Removal shifts later indices; clear any stale selection so the next
      // Delete/Backspace press never targets a different point than intended.
      if (selectedIndex !== null) {
        if (index === selectedIndex) setSelectedIndex(null);
        else if (index < selectedIndex) setSelectedIndex(selectedIndex - 1);
      }
    },
    [points, replacePoints, selectedIndex],
  );

  const handleMovePoint = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= points.length) return;
      const next = points.slice();
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      replacePoints(next);
    },
    [points, replacePoints],
  );

  const handleMovePointToCoordinate = useCallback(
    (index: number, point: ManualTrackPoint) => {
      if (index < 0 || index >= points.length) return;
      const next = points.slice();
      next[index] = point;
      replacePoints(next);
    },
    [points, replacePoints],
  );

  const handleSelectPoint = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Window-level Delete/Backspace removes the currently selected map point
  // (added in feature-114). The handler no-ops when the user is typing in any
  // form field so that the literal characters "delete" / "backspace" in the
  // slug, title, or other inputs do not trigger a point removal.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (isEditingText(event.target)) return;
      event.preventDefault();
      handleRemovePoint(selectedIndex);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handleRemovePoint]);

  const distanceMeters = useMemo(() => computeEditorDistanceMeters(points), [points]);
  const distanceLabel = formatTrackDistance(distanceMeters) ?? "0 m";
  const hasEnoughPoints = points.length >= 2;
  const minimumPointsLabel = t("trackEditorMinimumPoints");

  return (
    <div className="grid gap-4">
      {renderFormFields()}
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 text-muted-foreground" />
            {t("trackEditorMapLabel")}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("trackEditorDistanceLabel", { distance: distanceLabel })}
          </div>
        </div>
        <TrackEditorMap
          points={points}
          onAddPoint={handleAddPoint}
          onMovePoint={handleMovePointToCoordinate}
          onSelectPoint={handleSelectPoint}
          selectedIndex={selectedIndex}
          ariaLabel={mapAriaLabel ?? t("trackEditorMapAriaLabel")}
        />
        <p className="text-xs text-muted-foreground">{t("trackEditorMapHelp")}</p>
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>
              {t("trackEditorPointListLabel")} ({points.length})
            </span>
            {renderExtraActions ? renderExtraActions() : null}
          </div>
          {points.length === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              {t("trackEditorPointListEmpty")}
            </div>
          ) : (
            <ul className="grid gap-1">
              {points.map((point, index) => (
                <li
                  key={`${index}-${point.lat}-${point.lng}`}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-md border px-2 py-1 text-xs"
                >
                  <span className="text-muted-foreground">#{index + 1}</span>
                  <span className="font-mono">
                    {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("trackEditorMoveUp")}
                      onClick={() => handleMovePoint(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("trackEditorMoveDown")}
                      onClick={() => handleMovePoint(index, 1)}
                      disabled={index === points.length - 1}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("trackEditorRemovePoint")}
                      onClick={() => handleRemovePoint(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!hasEnoughPoints ? <p className="text-xs text-destructive">{minimumPointsLabel}</p> : null}
        </div>
      </div>
    </div>
  );
};

// Re-export the Haversine constant so the editor's preview can be reasoned
// about as "the same Earth-radius value the server pipeline uses" in code
// review. Not consumed at runtime.
export { EARTH_RADIUS_METERS as TRACK_EDITOR_EARTH_RADIUS_METERS };

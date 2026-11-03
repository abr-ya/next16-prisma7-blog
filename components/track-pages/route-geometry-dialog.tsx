"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getRouteById, updateRoute, type RouteDetail, type RouteListItem } from "@/app/_data/routes";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Spinner } from "@/components/index";
import { TrackEditor, type ManualTrackPoint } from "@/components/track-pages/track-editor";

// feature-128: re-placing a route's points rewrites the shared geometry, so
// this dialog is separate from the title/description form. When more than one
// track uses the route, the owner must tick the confirmation that names the
// count; the server re-checks the same condition, because the row's count can
// be stale by the time the save lands.

type RouteGeometryDialogProps = {
  route: RouteListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const RouteGeometryDialog = ({ route, open, onOpenChange }: RouteGeometryDialogProps) => {
  const router = useRouter();
  // `undefined` is "still loading", `null` is "could not load". The panel
  // remounts this component per route (through `key`), so these states start
  // fresh on every open without a synchronous reset inside the effect.
  const [detail, setDetail] = useState<RouteDetail | null | undefined>(undefined);
  const [placedPoints, setPlacedPoints] = useState<ManualTrackPoint[]>([]);
  const [trackCountOverride, setTrackCountOverride] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!route) return;

    let cancelled = false;

    void getRouteById(route.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [route]);

  const loading = detail === undefined;
  const loadError = detail === null;
  const points = detail?.points ?? [];
  const trackCount = trackCountOverride ?? detail?.trackCount ?? route?.trackCount ?? 0;

  const handleSave = async () => {
    if (!route) return;

    if (placedPoints.length < 2) {
      toast.error("Place at least two points on the map");

      return;
    }

    setSaving(true);

    try {
      const result = await updateRoute({
        routeId: route.id,
        points: placedPoints,
        confirmShared: trackCount > 1 ? confirmed : undefined,
      });

      if (!result.ok) {
        if (result.code === "SHARED_CONFIRMATION" && result.linkedTrackCount !== undefined) {
          setTrackCountOverride(result.linkedTrackCount);
        }

        toast.error(result.message);

        return;
      }

      toast.success("Route geometry updated");
      router.refresh();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isShared = trackCount > 1;
  const canSave = placedPoints.length >= 2 && (!isShared || confirmed) && !saving;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl"
        aria-describedby="route-geometry-description"
      >
        <DialogHeader>
          <DialogTitle>Edit route geometry</DialogTitle>
        </DialogHeader>
        <p id="route-geometry-description" className="sr-only">
          Re-place the points of this route. When more than one track uses the route, every one of them takes the new
          shape.
        </p>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="size-6" />
          </div>
        ) : loadError ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            This route could not be loaded. Close the dialog and try again.
          </p>
        ) : (
          <div className="grid gap-4">
            <TrackEditor
              key={route?.id}
              initialPoints={points}
              onChangePoints={setPlacedPoints}
              renderFormFields={() => null}
              mapAriaLabel="Route geometry map"
            />

            {isShared ? (
              <div className="grid gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="font-medium">
                  This route is used by {trackCount} tracks. Saving replaces the shape on every one of them.
                </p>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>I understand this changes all {trackCount} linked tracks.</span>
                </label>
              </div>
            ) : null}

            <Button type="button" className="w-fit cursor-pointer" onClick={handleSave} disabled={!canSave}>
              {saving ? <Spinner className="size-6" /> : "Save geometry"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { useEffect, useState } from "react";

import { getRoutePreview, type RouteListItem } from "@/app/_data/routes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Spinner } from "@/components/index";
import { TrackMap, type TrackMapViewModel } from "@/components/track-pages/track-map";

// feature-128: the geometry preview. It lives in a dialog instead of the table
// row so the list payload stays text-only and the page never mounts one
// Leaflet instance per route. `getRoutePreview` returns `null` for a route
// whose stored metadata has no usable shape, which is the fallback case.

type RoutePreviewDialogProps = {
  route: RouteListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const RoutePreviewDialog = ({ route, open, onOpenChange }: RoutePreviewDialogProps) => {
  // `undefined` is "still loading", `null` is "no usable geometry". The panel
  // remounts this component per route (through `key`), so the state starts
  // fresh on every open without a synchronous reset inside the effect.
  const [preview, setPreview] = useState<TrackMapViewModel | null | undefined>(undefined);

  useEffect(() => {
    if (!route) return;

    let cancelled = false;

    void getRoutePreview(route.id)
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });

    return () => {
      cancelled = true;
    };
  }, [route]);

  const loading = preview === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl"
        aria-describedby="route-preview-description"
      >
        <DialogHeader>
          <DialogTitle>{route ? route.title : "Route preview"}</DialogTitle>
        </DialogHeader>
        <p id="route-preview-description" className="sr-only">
          The stored shape of this route.
        </p>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="size-6" />
          </div>
        ) : preview ? (
          <TrackMap track={preview} />
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            This route has no parseable geometry yet, so there is nothing to show.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

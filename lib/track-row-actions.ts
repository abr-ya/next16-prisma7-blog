"use client";

import { useT } from "next-i18next/client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { markTrackAsManual, parseTrackGpx, type TrackListItem } from "@/app/_data/tracks";
import { tripsNamespace } from "@/app/i18n/settings";

// feature-117: per-row pending-state machine for the admin tracks table.
// Owns `parsingTrackId`, `markingAsManualId`, `markAsManualTarget`, and the
// `handleParse` / `handleMarkAsManualConfirm` handlers. The panel wires the
// hook to its `DataTable`, `TrackFormDialog`, and mark-as-manual
// `ConfirmDialog`. The hook is `"use client"` because `useT` /
// `useTransition` are client-side; the precedent for `"use client"` in
// `lib/` is `lib/track-map-bounds.ts` (uses `useEffect` + `useMap`).
//
// `onSuccess` is captured in a ref so the returned handlers keep a stable
// identity across renders; the panel's
// `useMemo(() => createTracksAdminColumns({ handleParse, ... }), [...])`
// then does not have to list `onSuccess` (passed as
// `() => router.refresh()` inline) in its dependency array. The hook
// itself does not call `router.refresh()` — that lives in `onSuccess`,
// which the panel wires to its own `router.refresh`.
type UseTrackRowActionsInput = {
  onSuccess?: () => void;
};

const useTrackRowActions = ({ onSuccess }: UseTrackRowActionsInput = {}) => {
  const { t } = useT(tripsNamespace);
  const [parsingTrackId, setParsingTrackId] = useState<string | null>(null);
  const [markingAsManualId, setMarkingAsManualId] = useState<string | null>(null);
  const [markAsManualTarget, setMarkAsManualTarget] = useState<TrackListItem | null>(null);
  const [, startParsing] = useTransition();

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  const handleParse = useCallback((track: TrackListItem) => {
    setParsingTrackId(track.id);

    startParsing(async () => {
      try {
        const metadata = await parseTrackGpx(track.id);

        if (metadata.gpxParse.status === "SUCCESS") {
          toast.success("GPX parsed");
        } else {
          toast.error(metadata.gpxParse.errorMessage ?? "GPX parsing failed");
        }

        onSuccessRef.current?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to parse GPX");
      } finally {
        setParsingTrackId(null);
      }
    });
  }, []);

  const handleMarkAsManualConfirm = useCallback(async () => {
    if (!markAsManualTarget) {
      return;
    }
    setMarkingAsManualId(markAsManualTarget.id);
    try {
      const result = await markTrackAsManual({ id: markAsManualTarget.id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("trackMarkAsManualSuccess"));
      setMarkAsManualTarget(null);
      onSuccessRef.current?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark track as manual");
    } finally {
      setMarkingAsManualId(null);
    }
  }, [markAsManualTarget, t]);

  return {
    parsingTrackId,
    markingAsManualId,
    markAsManualTarget,
    setMarkAsManualTarget,
    handleParse,
    handleMarkAsManualConfirm,
  };
};

export { useTrackRowActions };
export type { UseTrackRowActionsInput };

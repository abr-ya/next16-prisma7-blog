"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTrackParse } from "@/app/_data/tracks";
import { Button, Spinner } from "@/components/index";

// feature-158: one owner action for an outdated, failed, stale, or never
// parsed file. The page decides when it is shown; the server re-checks the
// same rule.

export const TrackParseUpdateButton = ({ trackId }: { trackId: string }) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // feature-158 follow-up: the refresh is a transition, so the spinner and the
  // success toast wait for the new server payload instead of racing it.
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    if (!isRefreshing && showSuccess) {
      toast.success("Track data updated");
      setShowSuccess(false);
    }
  }, [isRefreshing, showSuccess]);

  const handleClick = async () => {
    setIsSaving(true);

    try {
      const result = await updateTrackParse(trackId);

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      setShowSuccess(true);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the track data");
    } finally {
      setIsSaving(false);
    }
  };

  const isPending = isSaving || isRefreshing;

  return (
    <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => void handleClick()}>
      {isPending ? <Spinner className="size-4" /> : <RotateCw className="size-4" />}
      {isRefreshing ? "Updating…" : "Update track data"}
    </Button>
  );
};

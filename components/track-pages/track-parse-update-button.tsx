"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTrackParse } from "@/app/_data/tracks";
import { Button, Spinner } from "@/components/index";

// feature-158: one owner action for an outdated, failed, stale, or never
// parsed file. The page decides when it is shown; the server re-checks the
// same rule.

export const TrackParseUpdateButton = ({ trackId }: { trackId: string }) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  // feature-158 follow-up: keep the spinner until the refreshed payload
  // renders. The success toast is raised immediately because the data is
  // already saved, and because the refreshed page removes this button — a
  // deferred toast would never fire after the unmount.
  const [isRefreshing, startTransition] = useTransition();

  const handleClick = async () => {
    setIsSaving(true);

    try {
      const result = await updateTrackParse(trackId);

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success("Track data updated");
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

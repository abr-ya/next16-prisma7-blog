"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { parseTrackGpx } from "@/app/_data/tracks";
import { Button, Spinner } from "@/components/index";

/**
 * feature-144: refresh an older GPX parse that predates the moving-time field.
 *
 * It reuses the existing owner-gated parse action, so there is no new
 * endpoint or permission; the page decides who may see it.
 */
export const TrackMovingTimeRecalcButton = ({ trackId }: { trackId: string }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);

    try {
      await parseTrackGpx(trackId);
      toast.success("Moving time recalculated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not re-parse the track");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => void handleClick()}>
      {isPending ? <Spinner className="size-4" /> : <RotateCw className="size-4" />}
      Recalculate moving time
    </Button>
  );
};

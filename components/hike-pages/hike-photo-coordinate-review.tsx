"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  acceptHikePhotoTrackTimeMatchCandidate,
  rejectHikePhotoMapCoordinate,
  type HikePhotoDetail,
} from "@/app/_data/hikes";
import { Badge, Button, Input } from "@/components/index";
import { formatTrackTimezoneEvidence } from "@/lib/track-gpx-metadata";

const candidateLabel = (type: HikePhotoDetail["candidates"][number]["type"], previousDayFinish?: boolean) =>
  type === "INSIDE_TRACK_WINDOW"
    ? "Inside track window"
    : type === "AFTER_TRACK_FINISH"
      ? previousDayFinish
        ? "Yesterday's finish"
        : "After track finish"
      : "Between tracks";

export const HikePhotoCoordinateReview = ({
  detail,
  onChanged,
}: {
  detail: HikePhotoDetail;
  onChanged: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const approve = (candidateId: string) => {
    startTransition(async () => {
      try {
        await acceptHikePhotoTrackTimeMatchCandidate({ hikeId: detail.hikeId, photoId: detail.photoId, candidateId });
        toast.success("Map coordinate approved");
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to approve map coordinate");
      }
    });
  };

  const reject = () => {
    startTransition(async () => {
      try {
        await rejectHikePhotoMapCoordinate({ hikeId: detail.hikeId, photoId: detail.photoId });
        toast.success("Map coordinate rejected");
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reject map coordinate");
      }
    });
  };

  return (
    <section className="grid gap-3 border-t pt-4">
      <div className="grid gap-1">
        <h3 className="font-medium">Review coordinate</h3>
        <p className="text-sm text-muted-foreground">
          Approve an available candidate, or use a manual correction when an automatic location is unavailable.
        </p>
      </div>
      {detail.candidates.length > 0 ? (
        detail.candidates.map((candidate) => (
          <div key={candidate.id} className="grid gap-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">
                {candidateLabel(
                  candidate.type,
                  candidate.type === "AFTER_TRACK_FINISH" ? candidate.previousDayFinish : undefined,
                )}
              </Badge>
              <Badge variant={candidate.placementMethod === "UNRESOLVED" ? "outline" : "secondary"}>
                {candidate.placementMethod === "UNRESOLVED" ? "Manual location needed" : "Coordinate available"}
              </Badge>
              {candidate.timezoneEvidence ? (
                <Badge variant="outline">{formatTrackTimezoneEvidence(candidate.timezoneEvidence)}</Badge>
              ) : null}
            </div>
            <p>{candidate.explanation}</p>
            {candidate.proposedCoordinate ? (
              <p className="text-muted-foreground">
                Proposed {candidate.proposedCoordinate.lat.toFixed(5)}, {candidate.proposedCoordinate.lng.toFixed(5)}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={isPending || candidate.placementMethod === "UNRESOLVED"}
                onClick={() => approve(candidate.id)}
              >
                Approve
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          No automatic coordinate is available from the linked tracks. Enter a manual correction below if needed.
        </p>
      )}
      <ManualCoordinateForm detail={detail} disabled={isPending} onChanged={onChanged} />
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={reject}>
          Reject map coordinate
        </Button>
      </div>
    </section>
  );
};

const ManualCoordinateForm = ({
  detail,
  disabled,
  onChanged,
}: {
  detail: HikePhotoDetail;
  disabled: boolean;
  onChanged: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    const lat = Number(formData.get("latitude"));
    const lng = Number(formData.get("longitude"));
    const candidate = detail.candidates[0];
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !candidate) {
      toast.error("Enter latitude and longitude, then choose an available candidate.");
      return;
    }
    startTransition(async () => {
      try {
        await acceptHikePhotoTrackTimeMatchCandidate({
          hikeId: detail.hikeId,
          photoId: detail.photoId,
          candidateId: candidate.id,
          lat,
          lng,
        });
        toast.success("Manual map coordinate approved");
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to approve manual coordinate");
      }
    });
  };

  return (
    <form action={submit} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="grid gap-1 text-xs font-medium">
        Latitude
        <Input name="latitude" placeholder="e.g. 55.75" />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Longitude
        <Input name="longitude" placeholder="e.g. 37.62" />
      </label>
      <Button type="submit" size="sm" disabled={disabled || isPending || detail.candidates.length === 0}>
        Save manual correction
      </Button>
    </form>
  );
};

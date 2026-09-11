import type { HikePhotoAcceptedCoordinate } from "@/app/_data/hikes";
import { Badge } from "@/components/index";
import {
  formatPhotoCapturedAt,
  formatPhotoDimensions,
  formatPhotoExposureTriplet,
  formatPhotoGpsPresence,
  type PhotoExifSummary,
} from "@/lib/photo-exif-metadata";

const sourceLabel = (source: HikePhotoAcceptedCoordinate["source"]) =>
  source === "DIRECT_EXIF"
    ? "Direct EXIF GPS"
    : source === "MANUALLY_CORRECTED"
      ? "Manual correction"
      : "Approved track-time inference";

export const HikePhotoDetailSummary = ({
  captureSummary,
  acceptedCoordinate,
}: {
  captureSummary: PhotoExifSummary | null;
  acceptedCoordinate: HikePhotoAcceptedCoordinate | null;
}) => {
  const exposure = captureSummary
    ? formatPhotoExposureTriplet({
        exposureTime: captureSummary.exposureTime,
        fNumber: captureSummary.fNumber,
        focalLength: captureSummary.focalLength,
      })
    : null;

  return (
    <div className="grid gap-4 text-sm">
      <section className="grid gap-2">
        <h3 className="font-medium">Capture details</h3>
        {captureSummary ? (
          <dl className="grid gap-1 text-muted-foreground sm:grid-cols-2">
            <div>Captured: {formatPhotoCapturedAt(captureSummary.capturedAt) ?? "Unavailable"}</div>
            <div>Camera: {captureSummary.cameraLabel ?? "Unavailable"}</div>
            <div>Dimensions: {formatPhotoDimensions(captureSummary.width, captureSummary.height) ?? "Unavailable"}</div>
            <div>Exposure: {exposure ?? "Unavailable"}</div>
            <div>{formatPhotoGpsPresence(captureSummary.gps)}</div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Capture metadata is unavailable.</p>
        )}
      </section>
      <section className="grid gap-2">
        <h3 className="font-medium">Map location</h3>
        {acceptedCoordinate ? (
          <div className="grid gap-1 text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{sourceLabel(acceptedCoordinate.source)}</Badge>
              {acceptedCoordinate.confidence ? (
                <Badge variant="outline">{`${acceptedCoordinate.confidence.toLowerCase()} confidence`}</Badge>
              ) : null}
            </div>
            <div>{`${acceptedCoordinate.lat.toFixed(5)}, ${acceptedCoordinate.lng.toFixed(5)}`}</div>
            {acceptedCoordinate.explanation ? <p>{acceptedCoordinate.explanation}</p> : null}
          </div>
        ) : (
          <p className="text-muted-foreground">No accepted location is available for this photo.</p>
        )}
      </section>
    </div>
  );
};

import type { HikePhotoAcceptedCoordinate } from "@/app/_data/hikes";
import { Badge } from "@/components/index";
import {
  formatPhotoCapturedAtInTimezone,
  formatPhotoCaptureTimeContext,
  formatPhotoCaptureTimeSource,
  formatPhotoDimensions,
  formatPhotoExposureTriplet,
  formatPhotoGpsPresence,
  type PhotoExifSummary,
  type PhotoExifMetadata,
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
  linkedTrackTimezones,
  adminExifMetadata,
}: {
  captureSummary: PhotoExifSummary | null;
  acceptedCoordinate: HikePhotoAcceptedCoordinate | null;
  linkedTrackTimezones: string[];
  adminExifMetadata: PhotoExifMetadata | null;
}) => {
  const linkedTrackTimezone = linkedTrackTimezones.length === 1 ? linkedTrackTimezones[0] : null;
  const captureTimeContext = formatPhotoCaptureTimeContext({
    capturedAt: captureSummary?.capturedAt,
    timezoneEvidence: captureSummary?.captureTimeTimezoneEvidence,
  });
  const primaryCapture = captureSummary?.captureTimeProvenance?.localWallTime
    ? `${captureSummary.captureTimeProvenance.localWallTime} (unconfirmed camera-local)`
    : (formatPhotoCapturedAtInTimezone(captureSummary?.capturedAt, linkedTrackTimezone) ??
      captureTimeContext?.storedUtc);
  const normalization = captureSummary?.captureTimeNormalization;
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
            <div>Captured: {primaryCapture ?? "Unavailable"}</div>
            {captureTimeContext ? <div>Captured (stored UTC): {captureTimeContext.storedUtc}</div> : null}
            {normalization ? (
              <div>
                Matching time:{" "}
                {formatPhotoCapturedAtInTimezone(normalization.instantUtc, normalization.timeZone) ??
                  normalization.instantUtc}{" "}
                ({normalization.provenance === "TRACK_DEFAULT" ? "linked-track default" : "owner/admin confirmed"})
              </div>
            ) : null}
            {captureSummary.captureTimeProvenance ? (
              <div>Capture source: {formatPhotoCaptureTimeSource(captureSummary.captureTimeProvenance.source)}</div>
            ) : null}
            {linkedTrackTimezone ? <div>Linked track timezone: {linkedTrackTimezone}</div> : null}
            {captureTimeContext ? <div>Timezone evidence: {captureTimeContext.timezoneEvidence}</div> : null}
            <div>Camera: {captureSummary.cameraLabel ?? "Unavailable"}</div>
            <div>Dimensions: {formatPhotoDimensions(captureSummary.width, captureSummary.height) ?? "Unavailable"}</div>
            <div>Exposure: {exposure ?? "Unavailable"}</div>
            <div>{formatPhotoGpsPresence(captureSummary.gps)}</div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Capture metadata is unavailable.</p>
        )}
      </section>
      {adminExifMetadata ? (
        <section className="grid gap-2">
          <h3 className="font-medium">EXIF extraction diagnostics</h3>
          <p className="text-muted-foreground">Use Refresh EXIF metadata to re-read the stored original file.</p>
          {adminExifMetadata.raw && Object.keys(adminExifMetadata.raw).length > 0 ? (
            <dl className="grid gap-1 text-muted-foreground sm:grid-cols-2">
              {Object.entries(adminExifMetadata.raw).map(([key, value]) => (
                <div key={key}>{`${key}: ${value}`}</div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">No safe EXIF/GPS fields were extracted.</p>
          )}
        </section>
      ) : null}
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

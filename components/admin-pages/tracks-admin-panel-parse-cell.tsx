"use client";

import { Loader2 } from "lucide-react";

import type { TrackListItem } from "@/app/_data/tracks";
import { Badge } from "@/components/index";
import {
  formatTrackDistance,
  formatTrackDuration,
  formatTrackPointCount,
  formatTrackRecordingDateTime,
  formatTrackRecordingTimeRange,
  formatTrackTimeSource,
  formatTrackTimezoneEvidence,
  formatTrackTimelinePresence,
  getTrackGpxMetadataState,
  hasTrackTimedTimeline,
  type TrackGpxMetadataState,
} from "@/lib/track-gpx-metadata";

// feature-117: this file owns the parse-column cell that the admin tracks
// table renders. It re-exports `TrackParseStatus` and `getTrackParseState`
// for the form dialog (still in `tracks-admin-panel.tsx`) to keep its
// current rendering unchanged. Future readers looking for the parse status
// rendering or its helper should look here, not in the panel file.

const getTrackParseState = (track: TrackListItem): TrackGpxMetadataState =>
  getTrackGpxMetadataState(track.metadata, {
    fileAssetId: track.fileAsset.id,
    fileKey: track.fileAsset.fileKey,
  });

const getParseStatusLabel = (state: TrackGpxMetadataState) => {
  if (state.status === "SUCCESS") return "Parsed";
  if (state.status === "FAILED") return "Failed";
  if (state.status === "STALE") return "Needs reparse";

  return "Not parsed";
};

const getParseStatusVariant = (state: TrackGpxMetadataState) => {
  if (state.status === "SUCCESS") return "default";
  if (state.status === "FAILED") return "destructive";

  return "outline";
};

const TrackParseStatus = ({ track }: { track: TrackListItem }) => {
  const state = getTrackParseState(track);
  const distance = state.status === "SUCCESS" ? formatTrackDistance(state.summary.distanceMeters) : null;
  const points = state.status === "SUCCESS" ? formatTrackPointCount(state.summary.points) : null;
  const timeline = state.status === "SUCCESS" ? formatTrackTimelinePresence(state.timeline) : null;
  const recordingTime =
    state.status === "SUCCESS" ? formatTrackRecordingTimeRange(state.summary.time, track.recordingTimezone) : null;
  const manualStart =
    track.timeSource === "MANUAL" && track.recordingStartAt
      ? formatTrackRecordingDateTime(track.recordingStartAt.toISOString(), track.recordingTimezone)
      : null;
  const manualDuration =
    track.timeSource === "MANUAL" && track.recordingDurationSeconds !== null
      ? formatTrackDuration(track.recordingDurationSeconds)
      : null;

  return (
    <div className="flex max-w-72 flex-wrap items-center gap-1.5">
      <div className="flex basis-full flex-wrap items-center gap-1.5">
        <Badge variant={getParseStatusVariant(state)}>{getParseStatusLabel(state)}</Badge>
        {state.status === "SUCCESS" && state.summary.time ? (
          <Badge variant={state.summary.time.timezoneEvidence === "UTC_OR_OFFSET" ? "secondary" : "outline"}>
            {formatTrackTimezoneEvidence(state.summary.time.timezoneEvidence)}
          </Badge>
        ) : null}
        {state.status === "SUCCESS" ? (
          <Badge variant={state.timeline && state.timeline.length > 0 ? "secondary" : "outline"}>{timeline}</Badge>
        ) : null}
      </div>
      {state.status === "SUCCESS" ? (
        <>
          {[distance, points].filter(Boolean).map((value) => (
            <span key={value} className="text-xs text-muted-foreground">
              {value}
            </span>
          ))}
          {recordingTime ? <span className="text-xs text-muted-foreground">Recording {recordingTime}</span> : null}
        </>
      ) : null}
      {track.timeSource === "MANUAL" && (manualStart || manualDuration) ? (
        <div className="flex basis-full flex-col gap-0.5 text-xs text-muted-foreground">
          {manualStart ? <span>Recording start: {manualStart}</span> : null}
          {manualDuration ? <span>Recording duration: {manualDuration}</span> : null}
        </div>
      ) : null}
      {state.status === "FAILED" || state.status === "STALE" ? (
        <div className="line-clamp-2 text-xs text-muted-foreground">{state.errorMessage}</div>
      ) : null}
    </div>
  );
};

// feature-116 row-level reclassify affordance: the `Source: …` badge in the
// table row is rendered as a clickable button when the row is a `GPX` track
// whose parsed GPX carries no `<time>` elements — i.e. the same condition
// the existing `No timed timeline` badge is built on. The cell passes the
// derived `hasNoTimedTimeline` flag in (so the badge and the timeline chip
// can never disagree), and the badge stays the static secondary variant
// for every other row (GPX with a real timeline, MANUAL, NONE). The
// mutation itself is owned by `TrackManagementPanel` and dispatched
// through the `onMarkAsManual` prop.
const SourceBadge = ({
  track,
  hasNoTimedTimeline,
  ariaLabel,
  isMarking,
  onMarkAsManual,
}: {
  track: TrackListItem;
  hasNoTimedTimeline: boolean;
  ariaLabel: string;
  isMarking: boolean;
  onMarkAsManual: () => void;
}) => {
  if (!track.timeSource) {
    return null;
  }
  if (!hasNoTimedTimeline) {
    return <Badge variant="secondary">Source: {formatTrackTimeSource(track.timeSource)}</Badge>;
  }
  return (
    <Badge variant="outline" asChild className="cursor-pointer border-yellow-500 text-yellow-700 dark:text-yellow-300">
      <button type="button" aria-label={ariaLabel} disabled={isMarking} onClick={onMarkAsManual}>
        {isMarking ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Source: {formatTrackTimeSource(track.timeSource)}
      </button>
    </Badge>
  );
};

export { getParseStatusLabel, getParseStatusVariant, getTrackParseState, SourceBadge, TrackParseStatus };

type TracksAdminPanelParseCellProps = {
  track: TrackListItem;
  markingAsManualId: string | null;
  onMarkAsManual: (track: TrackListItem) => void;
  markAsManualAriaLabel: string;
};

const TracksAdminPanelParseCell = ({
  track,
  markingAsManualId,
  onMarkAsManual,
  markAsManualAriaLabel,
}: TracksAdminPanelParseCellProps) => {
  const parseState = getTrackParseState(track);
  // feature-116: a misclassified row is a GPX track whose parsed GPX
  // carried no `<time>` elements (the same condition the existing
  // "No timed timeline" badge is built on). The cell exposes this
  // as `hasNoTimedTimeline` and `SourceBadge` decides clickability
  // from it.
  const hasNoTimedTimeline =
    track.timeSource === "GPX" && parseState.status === "SUCCESS" && !hasTrackTimedTimeline(parseState.timeline);

  return (
    <div className="flex max-w-72 flex-wrap items-center gap-1.5">
      <SourceBadge
        track={track}
        hasNoTimedTimeline={hasNoTimedTimeline}
        ariaLabel={markAsManualAriaLabel}
        isMarking={markingAsManualId === track.id}
        onMarkAsManual={() => onMarkAsManual(track)}
      />
      <TrackParseStatus track={track} />
    </div>
  );
};

export { TracksAdminPanelParseCell };

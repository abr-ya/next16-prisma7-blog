"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

import type { TrackListItem } from "@/app/_data/tracks";
import { Badge, Button, SortableHeader } from "@/components/index";
import {
  getEffectiveTrackDistanceMeters,
  getEffectiveTrackDurationSeconds,
  getEffectiveTrackStart,
} from "@/lib/track-effective-values";
import { formatTrackDistance, formatTrackDuration, formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { formatTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import { formatTrackStatus } from "@/lib/tracks";

// feature-120 follow-up: the "My workouts" table is a deliberately short
// owner-side list — badges, title, start date, distance and activity type.
// The heavy admin columns (GPX file, GPX summary, trips, updated) stay on
// the admin and "My tracks" tables; this factory composes the short
// variant and the panel swaps column sets through `tableVariant`.
//
// feature-123: the short list also carries the recording timezone and the
// recording duration — the two values that tell the owner when the workout
// happened and how long it lasted. The timezone sits next to the start
// column because that column renders the start in it.
//
// The row actions are kept to edit and delete so the page stays manageable;
// parsing, the timezone action and trip assignment remain on the full table.

// feature-131: derived sort values. The accessors and the cells must keep the
// same fallback chain, so both read through these helpers instead of repeating
// it in two places.
// feature-135: the helpers moved to `lib/track-effective-values.ts` so the
// week summary sums exactly the distance this column shows.

type CreateTrackWorkoutColumnsInput = {
  activeLanguage: string;
  onEditTrack: (track: TrackListItem) => void;
  onSetDeleteTarget: (track: TrackListItem) => void;
  formatActivityTypeName: (activityType: TrackListItem["activityType"], language?: string) => string;
  // feature-141: the draft row needs a visible "no track yet" marker next to
  // the Draft status.
  incompleteLabel: string;
};

const createTrackWorkoutColumns = ({
  activeLanguage,
  onEditTrack,
  onSetDeleteTarget,
  formatActivityTypeName,
  incompleteLabel,
}: CreateTrackWorkoutColumnsInput): ColumnDef<TrackListItem>[] => [
  {
    id: "badges",
    header: "Badges",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={row.original.kind === "TRAINING" ? "secondary" : "outline"}>
          {row.original.kind === "TRAINING" ? "Workout" : "Route"}
        </Badge>
        <Badge variant={row.original.status === "PUBLISHED" ? "default" : "secondary"}>
          {formatTrackStatus(row.original.status)}
        </Badge>
        {row.original.geometryState === "PENDING" ? <Badge variant="outline">{incompleteLabel}</Badge> : null}
      </div>
    ),
  },
  {
    accessorKey: "title",
    meta: { sortLabel: "Title" },
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) =>
      row.original.status === "PUBLISHED" ? (
        <Link
          href={`/tracks/${row.original.slug}`}
          className="font-medium text-foreground hover:underline focus-visible:underline"
        >
          {row.original.title}
        </Link>
      ) : (
        <div className="font-medium">{row.original.title}</div>
      ),
  },
  {
    id: "started",
    meta: { sortLabel: "Started" },
    // feature-129: the effective start is the recording start mirror or the
    // parsed summary fallback; the accessor exposes the same value the cell
    // renders so the default `Started desc` sort and the visible order agree.
    accessorFn: (row) => getEffectiveTrackStart(row),
    header: ({ column }) => <SortableHeader column={column} label="Started" />,
    cell: ({ row }) => {
      // `recordingStartAt` is the mirror of the parsed GPX start, but the
      // mirror only exists for rows parsed after it was added — an older
      // track keeps the start in its parsed summary only. Fall back to the
      // summary so those rows are not blank.
      const start = getEffectiveTrackStart(row.original);

      if (!start) return <span className="text-sm text-muted-foreground">—</span>;

      const formatted = formatTrackRecordingDateTime(start, row.original.recordingTimezone, {
        includeWeekday: true,
      });

      return <span className="text-sm">{formatted ?? "—"}</span>;
    },
    sortingFn: "datetime",
    sortUndefined: "last",
  },
  {
    id: "timezone",
    header: "Timezone",
    cell: ({ row }) => (
      <Badge variant={row.original.recordingTimezone ? "secondary" : "outline"}>
        {formatTrackRecordingTimezone(row.original.recordingTimezone)}
      </Badge>
    ),
  },
  {
    id: "distance",
    meta: { sortLabel: "Distance" },
    accessorFn: (row) => getEffectiveTrackDistanceMeters(row),
    header: ({ column }) => <SortableHeader column={column} label="Distance" />,
    cell: ({ row }) => {
      const distanceMeters = getEffectiveTrackDistanceMeters(row.original);

      if (distanceMeters === undefined) return <span className="text-sm text-muted-foreground">—</span>;

      const distance = formatTrackDistance(distanceMeters);

      return <span className="text-sm">{distance ?? "—"}</span>;
    },
    sortingFn: "basic",
    sortUndefined: "last",
  },
  {
    id: "duration",
    meta: { sortLabel: "Duration" },
    accessorFn: (row) => getEffectiveTrackDurationSeconds(row),
    header: ({ column }) => <SortableHeader column={column} label="Duration" />,
    cell: ({ row }) => {
      // The mirrored column is the duration the owner confirmed; a row parsed
      // before the column existed keeps its duration in the parsed summary.
      const seconds = getEffectiveTrackDurationSeconds(row.original);
      const duration = formatTrackDuration(seconds);

      if (!duration) return <span className="text-sm text-muted-foreground">—</span>;

      return <span className="text-sm">{duration}</span>;
    },
    sortingFn: "basic",
    sortUndefined: "last",
  },
  {
    id: "activityType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.activityType ? formatActivityTypeName(row.original.activityType, activeLanguage) : "Unclassified"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="icon" title="Edit track" onClick={() => onEditTrack(row.original)}>
          <Edit className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Delete track"
          onClick={() => onSetDeleteTarget(row.original)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    ),
  },
];

export { createTrackWorkoutColumns };
export type { CreateTrackWorkoutColumnsInput };

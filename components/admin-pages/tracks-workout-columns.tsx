"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

import type { TrackListItem } from "@/app/_data/tracks";
import { Badge, Button } from "@/components/index";
import { getTrackParseState } from "@/components/admin-pages/tracks-admin-panel-parse-cell";
import { formatTrackDistance, formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { formatTrackStatus } from "@/lib/tracks";

// feature-120 follow-up: the "My workouts" table is a deliberately short
// owner-side list — badges, title, start date, distance and activity type.
// The heavy admin columns (GPX file, GPX summary, timezone, trips, updated)
// stay on the admin and "My tracks" tables; this factory composes the
// short variant and the panel swaps column sets through `tableVariant`.
//
// The row actions are kept to edit and delete so the page stays manageable;
// parsing, timezone and trip assignment remain on the full table.

type CreateTrackWorkoutColumnsInput = {
  activeLanguage: string;
  onEditTrack: (track: TrackListItem) => void;
  onSetDeleteTarget: (track: TrackListItem) => void;
  formatActivityTypeName: (activityType: TrackListItem["activityType"], language?: string) => string;
};

const createTrackWorkoutColumns = ({
  activeLanguage,
  onEditTrack,
  onSetDeleteTarget,
  formatActivityTypeName,
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
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
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
    header: "Started",
    cell: ({ row }) => {
      const state = getTrackParseState(row.original);
      // `recordingStartAt` is the mirror of the parsed GPX start, but the
      // mirror only exists for rows parsed after it was added — an older
      // track keeps the start in its parsed summary only. Fall back to the
      // summary so those rows are not blank.
      const start =
        row.original.recordingStartAt?.toISOString() ??
        (state.status === "SUCCESS" ? (state.summary.time?.start ?? null) : null);

      if (!start) return <span className="text-sm text-muted-foreground">—</span>;

      const formatted = formatTrackRecordingDateTime(start, row.original.recordingTimezone);

      return <span className="text-sm">{formatted ?? "—"}</span>;
    },
  },
  {
    id: "distance",
    header: "Distance",
    cell: ({ row }) => {
      const state = getTrackParseState(row.original);

      if (state.status !== "SUCCESS") return <span className="text-sm text-muted-foreground">—</span>;

      const distance = formatTrackDistance(state.summary.distanceMeters);

      return <span className="text-sm">{distance ?? "—"}</span>;
    },
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

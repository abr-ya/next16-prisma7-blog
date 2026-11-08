"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Clock3, Download, Edit, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

import type { TrackListItem } from "@/app/_data/tracks";
import { Badge, Button, SortableHeader } from "@/components/index";
import { TracksAdminPanelParseCell } from "@/components/admin-pages/tracks-admin-panel-parse-cell";
import { formatFileSize } from "@/lib/file-upload-limits";
import { formatHikeDateRange, formatHikeStatus, formatHikeType } from "@/lib/hikes";
import { resolveTrackGeometry } from "@/lib/track-geometry";
import { getEffectiveTrackFinish, getEffectiveTrackStart } from "@/lib/track-effective-values";
import { formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { formatTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import { formatTrackStatus } from "@/lib/tracks";

// feature-117: column factory for the admin tracks table. The panel owns
// the row-action state machine (`parsingTrackId`, `markingAsManualId`,
// `markAsManualTarget`, `handleParse`, dialog setters); the factory only
// composes the columns. The caller wraps the call in `useMemo` with the
// same dependency list.

type CreateTracksAdminColumnsInput = {
  activeLanguage: string;
  handleParse: (track: TrackListItem) => void;
  markingAsManualId: string | null;
  onMarkAsManual: (track: TrackListItem) => void;
  onSetTimezoneTarget: (track: TrackListItem) => void;
  onEditTrack: (track: TrackListItem) => void;
  onSetDeleteTarget: (track: TrackListItem) => void;
  parsingTrackId: string | null;
  t: TFunction;
  formatDate: (value: Date | string) => string;
  formatActivityTypeName: (activityType: TrackListItem["activityType"], language?: string) => string;
};

const createTracksAdminColumns = ({
  activeLanguage,
  handleParse,
  markingAsManualId,
  onMarkAsManual,
  onSetTimezoneTarget,
  onEditTrack,
  onSetDeleteTarget,
  parsingTrackId,
  t,
  formatDate,
  formatActivityTypeName,
}: CreateTracksAdminColumnsInput): ColumnDef<TrackListItem>[] => [
  {
    id: "classification",
    header: "Class",
    cell: ({ row }) => (
      <div className="flex w-24 max-w-24 flex-wrap items-center gap-1">
        <Badge
          variant={row.original.kind === "TRAINING" ? "secondary" : "outline"}
          className="max-w-full min-w-0 truncate"
        >
          {row.original.kind === "TRAINING" ? "Workout" : "Route"}
        </Badge>
        <Badge variant="outline" className="max-w-full min-w-0 truncate">
          {row.original.activityType
            ? formatActivityTypeName(row.original.activityType, activeLanguage)
            : "Unclassified"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "title",
    meta: { sortLabel: "Title" },
    header: ({ column }) => <SortableHeader column={column} label="Title" className="w-40 justify-start" />,
    cell: ({ row }) => (
      <div className="grid w-40 max-w-40 gap-1">
        {row.original.status === "PUBLISHED" ? (
          <Link
            href={`/tracks/${row.original.slug}`}
            title={row.original.title}
            className="truncate font-medium text-foreground hover:underline focus-visible:underline"
          >
            {row.original.title}
          </Link>
        ) : (
          <div className="truncate font-medium" title={row.original.title}>
            {row.original.title}
          </div>
        )}
        <Badge variant={row.original.status === "PUBLISHED" ? "default" : "secondary"} className="w-fit">
          {formatTrackStatus(row.original.status)}
        </Badge>
      </div>
    ),
  },
  {
    id: "parse",
    header: "GPX summary",
    cell: ({ row }) => (
      <TracksAdminPanelParseCell
        track={row.original}
        markingAsManualId={markingAsManualId}
        onMarkAsManual={onMarkAsManual}
        markAsManualAriaLabel={t("trackMarkAsManualBadgeAriaLabel")}
      />
    ),
  },
  {
    id: "recording",
    accessorFn: (row) => getEffectiveTrackStart(row),
    meta: { sortLabel: "Recording" },
    header: ({ column }) => <SortableHeader column={column} label="Recording" className="w-44 justify-start" />,
    sortingFn: "datetime",
    sortUndefined: "last",
    cell: ({ row }) => {
      const start = getEffectiveTrackStart(row.original);
      const finish = getEffectiveTrackFinish(row.original);
      const timezone = row.original.recordingTimezone;
      const timezoneLabel = formatTrackRecordingTimezone(timezone);

      return (
        <div className="grid w-44 max-w-44 gap-1">
          <div className="grid gap-0.5 text-sm">
            <span className="truncate" title={start ?? undefined}>
              <span className="text-muted-foreground">Start: </span>
              {start ? (formatTrackRecordingDateTime(start, timezone) ?? "—") : "—"}
            </span>
            <span className="truncate" title={finish ?? undefined}>
              <span className="text-muted-foreground">End: </span>
              {finish ? (formatTrackRecordingDateTime(finish, timezone) ?? "—") : "—"}
            </span>
          </div>
          <Badge
            variant={timezone ? "secondary" : "outline"}
            className="w-fit max-w-full truncate"
            title={timezone ?? timezoneLabel}
          >
            {timezoneLabel}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "hikes",
    header: "Trips",
    cell: ({ row }) => (
      <div className="flex max-w-56 flex-col gap-1">
        {row.original.hikes.length > 0 ? (
          row.original.hikes.slice(0, 2).map(({ hike }) => (
            <div key={hike.id} className="grid gap-1">
              <div className="truncate text-sm font-medium" title={hike.title}>
                {hike.title}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant={hike.status === "PUBLISHED" ? "default" : "secondary"}>
                  {formatHikeStatus(hike.status)}
                </Badge>
                <Badge variant="outline">{formatHikeType(hike.type)}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{formatHikeDateRange(hike)}</div>
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )}
        {row.original.hikes.length > 2 ? <Badge variant="outline">+{row.original.hikes.length - 2}</Badge> : null}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    meta: { sortLabel: "Updated" },
    header: ({ column }) => <SortableHeader column={column} label="Updated" className="w-28 justify-start" />,
    cell: ({ row }) => (
      <span className="block w-28 truncate" title={formatDate(row.original.updatedAt)}>
        {formatDate(row.original.updatedAt)}
      </span>
    ),
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const fileAsset = resolveTrackGeometry(row.original)?.fileAsset ?? null;
      const downloadTitle = fileAsset ? `Download ${fileAsset.name}` : "No GPX file";

      return (
        <div className="flex items-start justify-end gap-2">
          <div className="flex flex-col items-center gap-1">
            {fileAsset ? (
              <Button asChild variant="ghost" size="icon">
                <Link href={`/files/${fileAsset.id}/download`} title={downloadTitle} aria-label={downloadTitle}>
                  <Download className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="icon" title={downloadTitle} disabled>
                <Download className="size-4" />
              </Button>
            )}
            <span className="text-[10px] text-muted-foreground">
              {fileAsset ? formatFileSize(fileAsset.sizeBytes) : ""}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Set recording timezone"
            onClick={() => onSetTimezoneTarget(row.original)}
          >
            <Clock3 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Parse GPX"
            disabled={parsingTrackId === row.original.id}
            onClick={() => handleParse(row.original)}
          >
            <RefreshCw className={`size-4 ${parsingTrackId === row.original.id ? "animate-spin" : ""}`} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Edit track"
            onClick={() => onEditTrack(row.original)}
          >
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
      );
    },
  },
];

export { createTracksAdminColumns };
export type { CreateTracksAdminColumnsInput };

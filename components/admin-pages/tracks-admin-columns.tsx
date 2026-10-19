"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ArrowUpDown, Clock3, Edit, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

import type { TrackListItem } from "@/app/_data/tracks";
import { Badge, Button } from "@/components/index";
import { TracksAdminPanelParseCell } from "@/components/admin-pages/tracks-admin-panel-parse-cell";
import { formatFileSize } from "@/lib/file-upload-limits";
import { formatHikeDateRange, formatHikeStatus, formatHikeType } from "@/lib/hikes";
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
    id: "activityType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.activityType ? formatActivityTypeName(row.original.activityType, activeLanguage) : "Unclassified"}
      </Badge>
    ),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title
        <ArrowUpDown />
      </Button>
    ),
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
    accessorKey: "fileAsset.name",
    header: "GPX file",
    cell: ({ row }) => (
      <div className="grid max-w-64 gap-1">
        <div className="truncate" title={row.original.fileAsset.name}>
          {row.original.fileAsset.name}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={row.original.status === "PUBLISHED" ? "default" : "secondary"}>
            {formatTrackStatus(row.original.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatFileSize(row.original.fileAsset.sizeBytes)}</span>
        </div>
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
    id: "timezone",
    header: "Timezone",
    cell: ({ row }) => (
      <Badge variant={row.original.recordingTimezone ? "secondary" : "outline"}>
        {formatTrackRecordingTimezone(row.original.recordingTimezone)}
      </Badge>
    ),
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
    header: "Updated",
    cell: ({ row }) => formatDate(row.original.updatedAt),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
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

export { createTracksAdminColumns };
export type { CreateTracksAdminColumnsInput };

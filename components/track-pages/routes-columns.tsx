"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Map, MapPin, Pencil, Trash2 } from "lucide-react";

import type { RouteListItem } from "@/app/_data/routes";
import { Badge, Button, SortableHeader } from "@/components/index";

// feature-128: the owner's route library. The table stays short — the title,
// the description, the linked-track count, and the day the route was created.
// Geometry is deliberately not in the list payload; the preview dialog reads
// it on demand.

type CreateRouteColumnsInput = {
  onPreview: (route: RouteListItem) => void;
  onEdit: (route: RouteListItem) => void;
  onEditGeometry: (route: RouteListItem) => void;
  onSetDeleteTarget: (route: RouteListItem) => void;
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const createRouteColumns = ({
  onPreview,
  onEdit,
  onEditGeometry,
  onSetDeleteTarget,
}: CreateRouteColumnsInput): ColumnDef<RouteListItem>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description?.trim();

      return <span className="line-clamp-2 block max-w-md text-sm text-muted-foreground">{description || "—"}</span>;
    },
  },
  {
    accessorKey: "trackCount",
    header: ({ column }) => <SortableHeader column={column} label="Tracks" className="w-24 justify-start" />,
    cell: ({ row }) => (
      <Badge variant={row.original.trackCount > 0 ? "secondary" : "outline"}>{row.original.trackCount}</Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Added" className="w-28 justify-start" />,
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const route = row.original;
      const isInUse = route.trackCount > 0;

      return (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Preview route"
            aria-label={`Preview ${route.title}`}
            onClick={() => onPreview(route)}
          >
            <Map className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Edit title and description"
            aria-label={`Edit ${route.title}`}
            onClick={() => onEdit(route)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Edit route geometry"
            aria-label={`Edit geometry of ${route.title}`}
            onClick={() => onEditGeometry(route)}
          >
            <MapPin className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={isInUse ? `Used by ${route.trackCount} track${route.trackCount === 1 ? "" : "s"}` : "Delete route"}
            aria-label={
              isInUse
                ? `${route.title} is used by ${route.trackCount} track${route.trackCount === 1 ? "" : "s"} and cannot be deleted`
                : `Delete ${route.title}`
            }
            disabled={isInUse}
            onClick={() => onSetDeleteTarget(route)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },
  },
];

export { createRouteColumns };
export type { CreateRouteColumnsInput };

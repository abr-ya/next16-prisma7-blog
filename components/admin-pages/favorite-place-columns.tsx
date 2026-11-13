"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

import type { FavoritePlaceListItem } from "@/app/_data/favorite-places";
import { Button } from "@/components/index";

// feature-148: the saved places table is deliberately short — the name the
// owner typed, the coordinate they dropped, and the day they added it. The
// two row actions are rename and delete; the coordinate is not editable here,
// it is dropped anew by adding another place.

type FavoritePlaceColumnLabels = {
  name: string;
  coordinate: string;
  added: string;
  rename: string;
  delete: string;
};

type CreateFavoritePlaceColumnsInput = {
  activeLanguage: string;
  labels: FavoritePlaceColumnLabels;
  onEditPlace: (place: FavoritePlaceListItem) => void;
  onSetDeleteTarget: (place: FavoritePlaceListItem) => void;
};

const formatCoordinate = (latitude: number, longitude: number) => `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

const createFavoritePlaceColumns = ({
  activeLanguage,
  labels,
  onEditPlace,
  onSetDeleteTarget,
}: CreateFavoritePlaceColumnsInput): ColumnDef<FavoritePlaceListItem>[] => [
  {
    accessorKey: "name",
    header: labels.name,
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    id: "coordinate",
    header: labels.coordinate,
    cell: ({ row }) => (
      <span className="font-mono text-sm">{formatCoordinate(row.original.latitude, row.original.longitude)}</span>
    ),
  },
  {
    id: "createdAt",
    header: labels.added,
    cell: ({ row }) => (
      <span className="text-sm">
        {new Intl.DateTimeFormat(activeLanguage, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(new Date(row.original.createdAt))}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={labels.rename}
          aria-label={labels.rename}
          onClick={() => onEditPlace(row.original)}
        >
          <Edit className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={labels.delete}
          aria-label={labels.delete}
          onClick={() => onSetDeleteTarget(row.original)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    ),
  },
];

export { createFavoritePlaceColumns };
export type { CreateFavoritePlaceColumnsInput, FavoritePlaceColumnLabels };

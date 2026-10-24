"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";

import type { GearListItem } from "@/app/_data/gear";
import { Badge, Button } from "@/components/index";
import { gearActivityTypeLabels } from "@/lib/gear";

// feature-121: the gear table is deliberately short — the name, the borrowed
// activity types, and the day the item was added. The row actions are edit and
// delete, the same two the track tables offer, so a deletion reads the same
// everywhere in the owner pages.

type CreateGearColumnsInput = {
  activeLanguage: string;
  onEditGear: (gear: GearListItem) => void;
  onSetDeleteTarget: (gear: GearListItem) => void;
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const createGearColumns = ({
  activeLanguage,
  onEditGear,
  onSetDeleteTarget,
}: CreateGearColumnsInput): ColumnDef<GearListItem>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    id: "activityTypes",
    header: "Types",
    cell: ({ row }) => {
      const labels = gearActivityTypeLabels(row.original.activityTypes, activeLanguage);

      if (!labels.length) return <Badge variant="outline">Unclassified</Badge>;

      return (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "createdAt",
    header: "Added",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="icon" title="Edit gear" onClick={() => onEditGear(row.original)}>
          <Edit className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Delete gear"
          onClick={() => onSetDeleteTarget(row.original)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    ),
  },
];

export { createGearColumns };
export type { CreateGearColumnsInput };

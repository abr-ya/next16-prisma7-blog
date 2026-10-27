"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, X } from "lucide-react";

import type { GearListItem, OwnerGearPreferences } from "@/app/_data/gear";
import { Badge, Button } from "@/components/index";
import { formatGearActivityTypeName, gearActivityTypeLabels } from "@/lib/gear";

// feature-121: the gear table is deliberately short — the name, the borrowed
// activity types, and the day the item was added. The row actions are edit and
// delete, the same two the track tables offer, so a deletion reads the same
// everywhere in the owner pages.
//
// feature-124: the table also says which item is the preferred one for which
// activity type, and carries the control that drops the preference.

type CreateGearColumnsInput = {
  activeLanguage: string;
  preferences: OwnerGearPreferences;
  onEditGear: (gear: GearListItem) => void;
  onSetDeleteTarget: (gear: GearListItem) => void;
  onClearPreference: (activityTypeId: string) => void;
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const createGearColumns = ({
  activeLanguage,
  preferences,
  onEditGear,
  onSetDeleteTarget,
  onClearPreference,
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
    // feature-124: the preferred item for an activity type. The badge names
    // the type in the interface language, and the control in it drops the
    // preference.
    id: "preferredFor",
    header: "Default",
    cell: ({ row }) => {
      const preferredTypes = Object.values(preferences).filter((preference) => preference.gearId === row.original.id);

      if (!preferredTypes.length) return <span className="text-muted-foreground text-sm">—</span>;

      return (
        <div className="flex flex-wrap gap-1">
          {preferredTypes.map((preference) => {
            const typeName = formatGearActivityTypeName(preference.activityType, activeLanguage);

            return (
              <Badge key={preference.activityType.id} variant="secondary" className="gap-1">
                <span>Default for {typeName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-4"
                  title={`Clear the default for ${typeName}`}
                  aria-label={`Clear the default for ${typeName}`}
                  onClick={() => onClearPreference(preference.activityType.id)}
                >
                  <X className="size-3" />
                </Button>
              </Badge>
            );
          })}
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

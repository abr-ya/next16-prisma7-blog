"use client";

import { Plus } from "lucide-react";
import { useT } from "next-i18next/client";
import { useMemo, useState } from "react";

import { deleteGear, type GearListItem } from "@/app/_data/gear";
import { navigationNamespace } from "@/app/i18n/settings";
import { createGearColumns } from "@/components/admin-pages/gear-columns";
import { GearFormDialog } from "@/components/admin-pages/gear-form-dialog";
import { Button, ConfirmDialog, DataTable } from "@/components/index";
import type { TrackActivityType } from "@/generated/prisma/client";
import { gearActivityTypeOptions } from "@/lib/gear";
import { useDeleteRowConfirm } from "@/lib/use-delete-row-confirm";

// feature-121: the owner-side gear panel. It owns the create/edit dialog and
// the delete confirmation, and reads everything else from its props — the
// owner scoping happens in the data layer, never in this component.

type GearPanelProps = {
  gear: GearListItem[];
  activityTypes: TrackActivityType[];
};

export const GearPanel = ({ gear, activityTypes }: GearPanelProps) => {
  const { i18n } = useT(navigationNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const [formOpen, setFormOpen] = useState(false);
  const [editingGear, setEditingGear] = useState<GearListItem | null>(null);

  const deleteConfirm = useDeleteRowConfirm<GearListItem>({
    // The shared hook reports a boolean, while the gear action answers with a
    // typed result. A record that is missing or owned by somebody else comes
    // back as NOT_FOUND, which is exactly what `notFoundMsg` says.
    deleteAction: async (id) => {
      const result = await deleteGear(id);

      return { success: result.ok };
    },
    title: "Delete gear?",
    getDescription: (row) => `This will remove "${row.name}" from your gear list.`,
    deletedMsg: "Gear deleted",
    notFoundMsg: "Gear not found",
  });

  const columns = useMemo(
    () =>
      createGearColumns({
        activeLanguage,
        onEditGear: (gearItem) => {
          setEditingGear(gearItem);
          setFormOpen(true);
        },
        onSetDeleteTarget: deleteConfirm.setTarget,
      }),
    [activeLanguage, deleteConfirm.setTarget],
  );

  const activityTypeOptions = useMemo(
    () => gearActivityTypeOptions(activityTypes, activeLanguage),
    [activityTypes, activeLanguage],
  );

  const handleCreateClick = () => {
    setEditingGear(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleCreateClick}>
          <Plus />
          Add gear
        </Button>
      </div>

      {gear.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          You have no gear yet. Add the shoes or the bicycle you want to keep track of.
        </div>
      ) : (
        <DataTable data={gear} columns={columns} pagination={{ pageSize: 10 }} />
      )}

      <GearFormDialog
        gear={editingGear}
        activityTypeOptions={activityTypeOptions}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingGear(null);
        }}
      />

      <ConfirmDialog {...deleteConfirm.confirmDialogProps} />
    </div>
  );
};

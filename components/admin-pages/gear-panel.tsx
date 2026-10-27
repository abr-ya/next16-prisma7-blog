"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useT } from "next-i18next/client";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  clearPreferredGearForActivityType,
  deleteGear,
  type GearListItem,
  type OwnerGearPreferences,
} from "@/app/_data/gear";
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
  // feature-124: the owner's preferred gear per activity type. The map comes
  // from the page, which reads it with the owner's scope.
  preferences: OwnerGearPreferences;
};

export const GearPanel = ({ gear, activityTypes, preferences }: GearPanelProps) => {
  const router = useRouter();
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

  // feature-124: dropping the preference for an activity type. The action
  // carries the owner scope itself, so this only reports what happened and
  // asks the page for the new state.
  const handleClearPreference = useCallback(
    async (activityTypeId: string) => {
      const result = await clearPreferredGearForActivityType(activityTypeId);

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success("Default cleared");
      router.refresh();
    },
    [router],
  );

  const columns = useMemo(
    () =>
      createGearColumns({
        activeLanguage,
        preferences,
        onEditGear: (gearItem) => {
          setEditingGear(gearItem);
          setFormOpen(true);
        },
        onSetDeleteTarget: deleteConfirm.setTarget,
        onClearPreference: handleClearPreference,
      }),
    [activeLanguage, deleteConfirm.setTarget, handleClearPreference, preferences],
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
        activeLanguage={activeLanguage}
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

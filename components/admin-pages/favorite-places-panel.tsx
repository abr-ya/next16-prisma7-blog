"use client";

import { Plus } from "lucide-react";
import { useT } from "next-i18next/client";
import { useMemo, useState } from "react";

import { deleteFavoritePlace, type FavoritePlaceListItem } from "@/app/_data/favorite-places";
import { workspaceNamespace } from "@/app/i18n/settings";
import { createFavoritePlaceColumns } from "@/components/admin-pages/favorite-place-columns";
import { FavoritePlaceFormDialog } from "@/components/admin-pages/favorite-place-form-dialog";
import { Button, ConfirmDialog, DataTable } from "@/components/index";
import { useDeleteRowConfirm } from "@/lib/use-delete-row-confirm";

// feature-148: the owner-side saved places panel. It owns the create/rename
// dialog and the delete confirmation, and reads the list from its props — the
// owner scoping happens in the data layer, never in this component.

type FavoritePlacesPanelProps = {
  places: FavoritePlaceListItem[];
};

export const FavoritePlacesPanel = ({ places }: FavoritePlacesPanelProps) => {
  const { t, i18n } = useT(workspaceNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<FavoritePlaceListItem | null>(null);

  const deleteConfirm = useDeleteRowConfirm<FavoritePlaceListItem>({
    // The shared hook reports a boolean, while the action answers with a typed
    // result. A place that is missing or owned by somebody else comes back as
    // NOT_FOUND, which is exactly what `notFoundMsg` says.
    deleteAction: async (id) => {
      const result = await deleteFavoritePlace(id);

      return { success: result.ok };
    },
    title: t("places.deleteTitle"),
    getDescription: (row) => t("places.deleteDescription", { name: row.name }),
    deletedMsg: t("places.deleted"),
    notFoundMsg: t("places.notFound"),
  });

  const columns = useMemo(
    () =>
      createFavoritePlaceColumns({
        activeLanguage,
        labels: {
          name: t("places.name"),
          coordinate: t("places.coordinate"),
          added: t("places.added"),
          rename: t("places.rename"),
          delete: t("places.delete"),
        },
        onEditPlace: (place) => {
          setEditingPlace(place);
          setFormOpen(true);
        },
        onSetDeleteTarget: deleteConfirm.setTarget,
      }),
    [activeLanguage, deleteConfirm.setTarget, t],
  );

  const handleCreateClick = () => {
    setEditingPlace(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleCreateClick}>
          <Plus />
          {t("places.add")}
        </Button>
      </div>

      {places.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">{t("places.empty")}</div>
      ) : (
        <DataTable data={places} columns={columns} pagination={{ pageSize: 10 }} />
      )}

      <FavoritePlaceFormDialog
        place={editingPlace}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPlace(null);
        }}
      />

      <ConfirmDialog {...deleteConfirm.confirmDialogProps} />
    </div>
  );
};

export default FavoritePlacesPanel;

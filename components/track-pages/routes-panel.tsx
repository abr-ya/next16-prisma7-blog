"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { deleteRoute, type RouteListItem } from "@/app/_data/routes";
import { Button, ConfirmDialog, DataTable } from "@/components/index";
import { createRouteColumns } from "@/components/track-pages/routes-columns";
import { RouteFormDialog } from "@/components/track-pages/route-form-dialog";
import { RouteGeometryDialog } from "@/components/track-pages/route-geometry-dialog";
import { RoutePreviewDialog } from "@/components/track-pages/route-preview-dialog";
import { useDeleteRowConfirm } from "@/lib/use-delete-row-confirm";

// feature-128: the owner-side route library. The page reads the routes with
// the owner's scope and this panel only presents them — the same split the
// gear and track panels use.

type RoutesPanelProps = {
  routes: RouteListItem[];
};

export const RoutesPanel = ({ routes }: RoutesPanelProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteListItem | null>(null);
  const [geometryRoute, setGeometryRoute] = useState<RouteListItem | null>(null);
  const [previewRoute, setPreviewRoute] = useState<RouteListItem | null>(null);

  const deleteConfirm = useDeleteRowConfirm<RouteListItem>({
    // The button is disabled while a route has linked tracks, so a refusal
    // here means the count changed between render and click. The action still
    // answers with the readable reason; the hook has one error slot, so the
    // message is intentionally generic enough for both not-found and in-use.
    deleteAction: async (id) => {
      const result = await deleteRoute(id);

      return { success: result.ok };
    },
    title: "Delete route?",
    getDescription: (row) =>
      `This removes "${row.title}" and retires its GPX file. Only a route that no track uses can be deleted.`,
    deletedMsg: "Route deleted",
    notFoundMsg: "The route could not be deleted. Refresh the page and try again.",
  });

  const columns = useMemo(
    () =>
      createRouteColumns({
        onPreview: setPreviewRoute,
        onEdit: (route) => {
          setEditingRoute(route);
          setFormOpen(true);
        },
        onEditGeometry: setGeometryRoute,
        onSetDeleteTarget: deleteConfirm.setTarget,
      }),
    [deleteConfirm.setTarget],
  );

  const handleCreateClick = () => {
    setEditingRoute(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleCreateClick}>
          <Plus />
          New route
        </Button>
      </div>

      {routes.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          You have no routes yet. A route is a reusable shape: create one here, then pick it when you add a track.
        </div>
      ) : (
        <DataTable data={routes} columns={columns} pagination={{ pageSize: 10 }} />
      )}

      <RouteFormDialog
        key={formOpen ? (editingRoute?.id ?? "new-route") : "closed-route-form"}
        route={editingRoute}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRoute(null);
        }}
      />

      <RouteGeometryDialog
        key={geometryRoute?.id ?? "closed-geometry"}
        route={geometryRoute}
        open={Boolean(geometryRoute)}
        onOpenChange={(open) => {
          if (!open) setGeometryRoute(null);
        }}
      />

      <RoutePreviewDialog
        key={previewRoute?.id ?? "closed-preview"}
        route={previewRoute}
        open={Boolean(previewRoute)}
        onOpenChange={(open) => {
          if (!open) setPreviewRoute(null);
        }}
      />

      <ConfirmDialog {...deleteConfirm.confirmDialogProps} />
    </div>
  );
};

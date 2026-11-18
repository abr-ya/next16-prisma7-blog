"use client";

import { Layers, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { rebuildRouteComposition } from "@/app/_data/route-compositions";
import { deleteRoute, type RouteListItem } from "@/app/_data/routes";
import { Button, ConfirmDialog, DataTable } from "@/components/index";
import { RouteCompositionDialog } from "@/components/track-pages/route-composition-dialog";
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
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteListItem | null>(null);
  const [geometryRoute, setGeometryRoute] = useState<RouteListItem | null>(null);
  const [previewRoute, setPreviewRoute] = useState<RouteListItem | null>(null);
  // feature-153: the builder dialog. `null` route means "create a new
  // composite"; a stored row means "edit its recipe".
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [compositionRoute, setCompositionRoute] = useState<RouteListItem | null>(null);

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
        onEditComposition: (route) => {
          setCompositionRoute(route);
          setCompositionOpen(true);
        },
        onRebuild: (route) => {
          void rebuildRouteComposition(route.id).then((result) => {
            if (!result.ok) {
              toast.error(result.message);

              return;
            }

            toast.success("Route rebuilt");
            router.refresh();
          });
        },
        onSetDeleteTarget: deleteConfirm.setTarget,
      }),
    [deleteConfirm.setTarget, router],
  );

  const handleCreateClick = () => {
    setEditingRoute(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCompositionRoute(null);
            setCompositionOpen(true);
          }}
        >
          <Layers />
          New composite route
        </Button>
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

      <RouteCompositionDialog
        key={compositionOpen ? (compositionRoute?.id ?? "new-composition") : "closed-composition"}
        route={compositionRoute}
        routes={routes}
        open={compositionOpen}
        onOpenChange={(open) => {
          setCompositionOpen(open);
          if (!open) setCompositionRoute(null);
        }}
        onCreatePlainRoute={() => {
          setCompositionOpen(false);
          setCompositionRoute(null);
          setEditingRoute(null);
          setFormOpen(true);
        }}
      />

      <ConfirmDialog {...deleteConfirm.confirmDialogProps} />
    </div>
  );
};

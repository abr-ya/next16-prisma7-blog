"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useState } from "react";
import { toast } from "sonner";

import { attachRouteToTrack } from "@/app/_data/tracks";
import type { RouteListItem } from "@/app/_data/routes";
import { tripsNamespace } from "@/app/i18n/settings";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/index";
import { RouteFormDialog } from "@/components/track-pages/route-form-dialog";
import type { TrackGpxCoordinate } from "@/lib/track-gpx-metadata";

/**
 * feature-142: the owner's route control on the published track page. A
 * file-based track can attach a route and keep its file as the original
 * recording; a route-based track can replace its route. The confirmation is
 * the only place that describes the public change before it is written.
 */
export const TrackRouteControl = ({
  trackId,
  hasPrimaryRoute,
  routes,
  backgroundPoints,
}: {
  trackId: string;
  hasPrimaryRoute: boolean;
  routes: RouteListItem[];
  backgroundPoints: TrackGpxCoordinate[];
}) => {
  const router = useRouter();
  const { t } = useT(tripsNamespace);
  const [open, setOpen] = useState(false);
  const [createRouteOpen, setCreateRouteOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [pendingRouteId, setPendingRouteId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const buttonLabel = hasPrimaryRoute ? t("attachRoute.changeButton") : t("attachRoute.attachButton");

  const handleConfirm = async () => {
    if (!pendingRouteId) return;

    setIsBusy(true);
    const result = await attachRouteToTrack(trackId, pendingRouteId);
    setIsBusy(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(hasPrimaryRoute ? t("attachRoute.changedToast") : t("attachRoute.attachedToast"));
    setPendingRouteId(null);
    setOpen(false);
    setSelectedRouteId("");
    router.refresh();
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <MapPin />
        {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{hasPrimaryRoute ? t("attachRoute.changeTitle") : t("attachRoute.title")}</DialogTitle>
            <DialogDescription>{t("attachRoute.description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <span className="text-sm font-medium">{t("attachRoute.selectLabel")}</span>
            {routes.length > 0 ? (
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("attachRoute.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("attachRoute.empty")}{" "}
                <Link href="/my/routes" className="font-medium underline underline-offset-4">
                  {t("attachRoute.emptyLink")}
                </Link>
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateRouteOpen(true)}>
              {t("attachRoute.createNew")}
            </Button>
            <Button
              type="button"
              disabled={!selectedRouteId || isBusy}
              onClick={() => setPendingRouteId(selectedRouteId)}
            >
              {buttonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RouteFormDialog
        key={createRouteOpen ? "open-route-form" : "closed-route-form"}
        route={null}
        open={createRouteOpen}
        onOpenChange={setCreateRouteOpen}
        backgroundPoints={backgroundPoints}
        backgroundLabel={t("attachRoute.referenceLabel")}
        onCreated={(routeId) => {
          // The route exists now; the attach still needs its own confirmation.
          setCreateRouteOpen(false);
          setPendingRouteId(routeId);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingRouteId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingRouteId(null);
        }}
        title={hasPrimaryRoute ? t("attachRoute.confirmChangeTitle") : t("attachRoute.confirmAttachTitle")}
        description={hasPrimaryRoute ? t("attachRoute.confirmChangeDescription") : t("attachRoute.confirmDescription")}
        confirmLabel={buttonLabel}
        isPending={isBusy}
        onConfirm={handleConfirm}
        onCancel={() => setPendingRouteId(null)}
      />
    </>
  );
};

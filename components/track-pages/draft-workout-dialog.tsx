"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useT } from "next-i18next/client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import type { RouteListItem } from "@/app/_data/routes";
import {
  attachRouteToTrack,
  completeDraftWithFile,
  createDraftWorkout,
  updateDraftWorkout,
  type TrackListItem,
} from "@/app/_data/tracks";
import { tripsNamespace } from "@/app/i18n/settings";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/index";
import { Label } from "@/components/ui/label";
import { RouteFormDialog } from "@/components/track-pages/route-form-dialog";
import { TrackGearSelect, type TrackGearOption } from "@/components/track-pages/track-gear-select";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { gearFitsActivityType } from "@/lib/gear";
import { buildQuickWorkoutSlugBase, capitalizeQuickWorkoutNoun, getQuickWorkoutDaypart } from "@/lib/quick-workout";
import { formatManualTrackStartAt } from "@/lib/track-duration-input";

// feature-141: the quick capture for a workout whose geometry is not ready.
// The dialog owns the draft fields and the three completion actions; the full
// track form remains the editor after the draft becomes READY.

const draftSchema = z.object({
  recordingStartAt: z.string().min(1, { message: "Start is required" }),
  durationMinutes: z
    .string()
    .min(1, { message: "Duration is required" })
    .refine((value) => Number(value) > 0, { message: "Duration must be greater than zero" }),
  privateNote: z.string().max(2000, { message: "Private note must be 2000 characters or fewer" }).optional(),
  gearId: z.string().optional(),
});

type DraftFormValues = z.infer<typeof draftSchema>;

export type DraftWorkoutActivityType = {
  id: string;
  key: string;
};

export const DraftWorkoutDialog = ({
  open,
  onOpenChange,
  activityType,
  ownerGear,
  preferredGearId,
  routes,
  draft,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityType: DraftWorkoutActivityType;
  ownerGear: TrackGearOption[];
  preferredGearId?: string | null;
  routes: RouteListItem[];
  /** `null` creates; a pending row edits and can be completed. */
  draft?: TrackListItem | null;
  onSaved?: () => void;
}) => {
  const { i18n, t } = useT(tripsNamespace);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [createRouteOpen, setCreateRouteOpen] = useState(false);

  const browserTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? null, []);

  const fittingGear = useMemo(
    () =>
      ownerGear.filter((item) =>
        gearFitsActivityType(
          item.activityTypes.map((link) => link.activityTypeId),
          activityType.id,
        ),
      ),
    [activityType.id, ownerGear],
  );

  const defaultGearId = useMemo(() => {
    if (draft?.gear?.id && fittingGear.some((item) => item.id === draft.gear?.id)) return draft.gear.id;
    if (preferredGearId && fittingGear.some((item) => item.id === preferredGearId)) return preferredGearId;

    return "";
  }, [draft?.gear?.id, fittingGear, preferredGearId]);

  const defaultStart = useMemo(
    () =>
      draft?.recordingStartAt
        ? formatManualTrackStartAt({ value: draft.recordingStartAt, timezone: draft.recordingTimezone })
        : formatManualTrackStartAt({ value: new Date(), timezone: browserTimeZone }),
    [browserTimeZone, draft?.recordingStartAt, draft?.recordingTimezone],
  );

  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      recordingStartAt: defaultStart,
      durationMinutes: draft?.recordingDurationSeconds ? String(draft.recordingDurationSeconds / 60) : "60",
      privateNote: draft?.privateNote ?? "",
      gearId: defaultGearId,
    },
    mode: "onBlur",
  });

  const wordingPrefix = `quickWorkout.activities.${activityType.key}`;
  const noun = i18n.exists(`${wordingPrefix}.noun`, { ns: tripsNamespace })
    ? t(`${wordingPrefix}.noun`)
    : capitalizeQuickWorkoutNoun(activityType.key);

  const finish = useCallback(() => {
    onSaved?.();
    onOpenChange(false);
  }, [onOpenChange, onSaved]);

  const attachRoute = useCallback(
    async (routeId: string) => {
      if (!draft || !routeId) return;

      setIsCompleting(true);

      try {
        const result = await attachRouteToTrack(draft.id, routeId);

        if (!result.ok) {
          toast.error(result.message);

          return;
        }

        toast.success(t("draftWorkout.completeSuccess"));
        finish();
      } finally {
        setIsCompleting(false);
      }
    },
    [draft, finish, t],
  );

  const handleUploadComplete = useCallback(
    async ({ fileAssetId }: { fileAssetId: string; fileName: string }) => {
      if (!draft) return;

      setIsCompleting(true);

      try {
        const result = await completeDraftWithFile(draft.id, fileAssetId);

        if (!result.ok) {
          await markDiscardedTrackGpxFileAssetsPendingDelete([fileAssetId]);
          toast.error(result.message);

          return;
        }

        toast.success(t("draftWorkout.completeSuccess"));
        finish();
      } finally {
        setIsCompleting(false);
      }
    },
    [draft, finish, t],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    const startAt = new Date(values.recordingStartAt);
    if (Number.isNaN(startAt.getTime())) {
      toast.error(t("draftWorkout.invalidStart"));

      return;
    }

    const minutes = Number(values.durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error(t("draftWorkout.invalidDuration"));

      return;
    }

    const privateNote = values.privateNote?.trim() || null;
    const gearId = values.gearId || null;

    setIsSaving(true);

    try {
      if (draft) {
        const result = await updateDraftWorkout({
          id: draft.id,
          recordingStartAt: startAt.toISOString(),
          recordingTimezone: browserTimeZone,
          durationMinutes: minutes,
          privateNote,
          gearId,
        });

        if (!result.ok) {
          toast.error(result.message);

          return;
        }

        toast.success(t("draftWorkout.updateSuccess"));
      } else {
        const daypart = getQuickWorkoutDaypart(startAt, null);
        const adjective = i18n.exists(`${wordingPrefix}.dayparts.${daypart}`, { ns: tripsNamespace })
          ? t(`${wordingPrefix}.dayparts.${daypart}`)
          : "";
        const title = adjective ? `${adjective} ${noun}` : capitalizeQuickWorkoutNoun(noun);
        const slug = buildQuickWorkoutSlugBase({
          activityTypeKey: activityType.key,
          startAt,
          utcOffsetMinutes: null,
        });

        const result = await createDraftWorkout({
          title,
          slug,
          recordingStartAt: startAt.toISOString(),
          recordingTimezone: browserTimeZone,
          durationMinutes: minutes,
          privateNote,
          gearId,
        });

        if (!result.ok) {
          toast.error(result.message);

          return;
        }

        toast.success(t("draftWorkout.success"));
      }

      finish();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("draftWorkout.error"));
    } finally {
      setIsSaving(false);
    }
  });

  const canComplete = Boolean(draft && draft.geometryState === "PENDING");
  const isBusy = isSaving || isCompleting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft ? t("draftWorkout.editTitle") : t("draftWorkout.addTitle")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <FormField
                control={form.control}
                name="recordingStartAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("draftWorkout.startLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" disabled={isBusy} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("draftWorkout.durationLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0.1"
                        step="0.1"
                        inputMode="decimal"
                        placeholder={t("draftWorkout.durationPlaceholder")}
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privateNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("draftWorkout.noteLabel")}</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                        placeholder={t("draftWorkout.notePlaceholder")}
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fittingGear.length > 0 ? (
                <FormField
                  control={form.control}
                  name="gearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("draftWorkout.gearLabel")}</FormLabel>
                      <TrackGearSelect
                        value={field.value}
                        onChange={field.onChange}
                        gear={fittingGear}
                        activityTypeId={activityType.id}
                        noneLabel={t("draftWorkout.gearNone")}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : ownerGear.length > 0 ? (
                <p className="text-muted-foreground text-sm">{t("draftWorkout.gearEmpty")}</p>
              ) : null}

              {canComplete ? (
                <section className="grid gap-3 rounded-md border p-4">
                  <div className="grid gap-1">
                    <h3 className="text-sm font-semibold">{t("draftWorkout.completeTitle")}</h3>
                    <p className="text-muted-foreground text-sm">{t("draftWorkout.completeHint")}</p>
                  </div>

                  <div className="grid gap-2">
                    <Label>{t("draftWorkout.uploadGpx")}</Label>
                    <TrackGpxUploadSection
                      isEditing={false}
                      onUploadComplete={handleUploadComplete}
                      onUploadError={(message) => toast.error(message)}
                    />
                  </div>

                  {routes.length > 0 ? (
                    <div className="grid gap-2">
                      <Label>{t("draftWorkout.routeLabel")}</Label>
                      <Select value={selectedRouteId} onValueChange={setSelectedRouteId} disabled={isBusy}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("draftWorkout.routePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {routes.map((route) => (
                            <SelectItem key={route.id} value={route.id}>
                              {route.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!selectedRouteId || isBusy}
                        onClick={() => void attachRoute(selectedRouteId)}
                      >
                        {t("draftWorkout.attachRoute")}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t("draftWorkout.noRoutes")}</p>
                  )}

                  <Button type="button" variant="outline" disabled={isBusy} onClick={() => setCreateRouteOpen(true)}>
                    {t("draftWorkout.createRoute")}
                  </Button>
                </section>
              ) : null}

              <DialogFooter>
                <Button type="submit" disabled={isBusy}>
                  {isSaving ? t("draftWorkout.saving") : draft ? t("draftWorkout.saveChanges") : t("draftWorkout.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <RouteFormDialog
        route={null}
        open={createRouteOpen}
        onOpenChange={setCreateRouteOpen}
        onCreated={(routeId) => {
          void attachRoute(routeId);
        }}
      />
    </>
  );
};

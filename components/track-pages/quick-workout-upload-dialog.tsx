"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useT } from "next-i18next/client";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import type { RouteListItem } from "@/app/_data/routes";
import { createQuickRouteWorkout, createQuickWorkout } from "@/app/_data/tracks";
import { tripsNamespace } from "@/app/i18n/settings";
import {
  Button,
  ConfirmDialog,
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
import { TrackGearSelect, type TrackGearOption } from "@/components/track-pages/track-gear-select";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { gearFitsActivityType } from "@/lib/gear";
import { buildQuickWorkoutSlugBase, capitalizeQuickWorkoutNoun, getQuickWorkoutDaypart } from "@/lib/quick-workout";
import { formatManualTrackStartAt } from "@/lib/track-duration-input";
import { formatTrackDistance, formatTrackDuration, formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { parseTrackGpxPreview, type TrackGpxPreview } from "@/lib/track-gpx-parser";
import { formatFixedUtcOffset, toLocalRecordingOffsetMinutes } from "@/lib/track-recording-timezone";
import { useDiscardGuardedTrackForm } from "@/lib/use-discard-guarded-track-form";

// feature-123: the one-click quick upload.
//
// The dialog collects three things — a GPX file, a title, and optionally a
// pair of gear — and fills in everything else. It is parameterized by the
// activity type, so the next quick-add button is a wording entry and a
// prop, not a second component.
//
// feature-146: the same dialog also records a walk against a route the owner
// already has. The two are alternatives — one source of geometry — so the
// dialog switches its content in place instead of stacking a second modal.

const quickWorkoutSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  gearId: z.string().optional(),
  // feature-124: the owner asks for the attached gear to become the preferred
  // one for this activity type. It is off unless the owner says otherwise.
  rememberGear: z.boolean().optional(),
});

type QuickWorkoutFormValues = z.infer<typeof quickWorkoutSchema>;

// feature-146: the route mode collects a route, a start, a duration and the
// gear. The title and the slug are generated, so they are not fields.
const quickRouteWorkoutSchema = z.object({
  routeId: z.string().min(1, { message: "Route is required" }),
  recordingStartAt: z.string().min(1, { message: "Start is required" }),
  durationMinutes: z
    .string()
    .min(1, { message: "Duration is required" })
    .refine((value) => Number(value) > 0, { message: "Duration must be greater than zero" }),
  gearId: z.string().optional(),
});

type QuickRouteWorkoutFormValues = z.infer<typeof quickRouteWorkoutSchema>;

export type QuickWorkoutActivityType = {
  id: string;
  key: string;
};

export const QuickWorkoutUploadDialog = ({
  activityType,
  ownerGear,
  preferredGearId,
  routes,
  open,
  onOpenChange,
  onSaved,
}: {
  activityType: QuickWorkoutActivityType;
  ownerGear: TrackGearOption[];
  /**
   * feature-124: the owner's preferred gear record for this activity type.
   * It is offered as the default in the gear field; it never overrides the
   * owner's own pick.
   */
  preferredGearId?: string | null;
  /**
   * feature-146: the owner's route library. Only the routes whose metadata
   * parsed are offered — a route without it carries no points, so it cannot
   * become a workout's geometry.
   */
  routes?: RouteListItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) => {
  const { i18n, t } = useT(tripsNamespace);
  const [fileAssetId, setFileAssetId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<TrackGpxPreview | null>(null);
  const [slugBase, setSlugBase] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // feature-146: the upload is running. The route action is disabled while
  // it does — the file and the route are alternatives.
  const [isUploading, setIsUploading] = useState(false);
  // feature-146: which source of geometry the dialog is collecting.
  const [mode, setMode] = useState<"gpx" | "route">("gpx");
  // The title the dialog suggested last. The owner's own wording is never
  // overwritten — only a previous suggestion is replaced by a new one.
  const suggestedTitleRef = useRef<string | null>(null);

  // The device's own zone. It is the fallback for a GPX file that names no
  // UTC offset, and it is the zone the route mode's wall clock is read in.
  const deviceTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? null, []);

  // feature-146: only a route with parsed metadata can become a workout's
  // geometry.
  const parsedRoutes = useMemo(() => (routes ?? []).filter((route) => route.hasMetadata), [routes]);

  // feature-124: the gear that fits this activity type. The owner's own
  // compatibility rule decides, the same one the attachment uses.
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

  // feature-124: the preferred gear for this activity type is offered as the
  // default. A default is not a decision — the owner may pick another item,
  // or none at all.
  const preselectedGearId = useMemo(
    () => (preferredGearId && fittingGear.some((item) => item.id === preferredGearId) ? preferredGearId : ""),
    [fittingGear, preferredGearId],
  );

  const form = useForm<QuickWorkoutFormValues>({
    resolver: zodResolver(quickWorkoutSchema),
    defaultValues: { title: "", gearId: preselectedGearId, rememberGear: false },
    mode: "onBlur",
  });

  // feature-146: the route mode keeps its own state, so a round trip back to
  // the file mode does not lose the typed title or the chosen gear.
  const routeForm = useForm<QuickRouteWorkoutFormValues>({
    resolver: zodResolver(quickRouteWorkoutSchema),
    defaultValues: {
      routeId: "",
      recordingStartAt: formatManualTrackStartAt({ value: new Date(), timezone: deviceTimeZone }),
      durationMinutes: "60",
      gearId: preselectedGearId,
    },
    mode: "onBlur",
  });

  const selectedGearId = useWatch({ control: form.control, name: "gearId" });
  const routeValues = useWatch({ control: routeForm.control });

  const wordingPrefix = `quickWorkout.activities.${activityType.key}`;
  const noun = i18n.exists(`${wordingPrefix}.noun`, { ns: tripsNamespace })
    ? t(`${wordingPrefix}.noun`)
    : capitalizeQuickWorkoutNoun(activityType.key);

  // feature-140: the route mode belongs to walking — the workout it creates
  // is a walking workout, and the server refuses the route save for any
  // other activity type. Another type gets the file mode alone.
  const isWalking = activityType.key === "walking";

  // feature-124: the control names the activity type in the interface
  // language. The wording dictionary owns the grammar of that name — the
  // Russian form of a preposition needs a case the generic wording cannot
  // guess — so the activity type carries its own entry, and the generic
  // wording is the fallback for a type that has none.
  const rememberGearLabel = i18n.exists(`${wordingPrefix}.rememberGearLabel`, { ns: tripsNamespace })
    ? t(`${wordingPrefix}.rememberGearLabel`)
    : t("quickWorkout.rememberGearLabel", { activity: noun });

  const resetFormState = useCallback(() => {
    form.reset({ title: "", gearId: preselectedGearId, rememberGear: false });
    routeForm.reset({
      routeId: "",
      recordingStartAt: formatManualTrackStartAt({ value: new Date(), timezone: deviceTimeZone }),
      durationMinutes: "60",
      gearId: preselectedGearId,
    });
    suggestedTitleRef.current = null;
    setMode("gpx");
    setFileAssetId(null);
    setFileName(null);
    setPreview(null);
    setSlugBase(null);
    setUploadError(null);
  }, [deviceTimeZone, form, preselectedGearId, routeForm]);

  const discardGuard = useDiscardGuardedTrackForm({
    hasUnsavedChanges: form.formState.isDirty || routeForm.formState.isDirty,
    resetFormState,
    onOpenChange,
  });

  const suggestTitle = useCallback(
    (nextTitle: string) => {
      const currentTitle = form.getValues("title");

      if (currentTitle.trim() && currentTitle !== suggestedTitleRef.current) return;

      suggestedTitleRef.current = nextTitle;
      form.setValue("title", nextTitle, { shouldDirty: true });
    },
    [form],
  );

  // feature-123: the file is read in the browser, once, while the upload is
  // still running. The parse is the module's own — the browser says exactly
  // what the server will say — but only the server's parse is stored.
  const handleBeforeUpload = useCallback(
    (files: File[]) => {
      setIsUploading(true);

      const file = files[0];

      if (!file) return;

      void file.text().then((content) => {
        const parsed = parseTrackGpxPreview(content);

        setUploadError(null);

        if (!parsed) {
          setPreview(null);
          setSlugBase(null);
          suggestTitle(capitalizeQuickWorkoutNoun(noun));
          return;
        }

        setPreview(parsed);

        if (!parsed.startAt) {
          // A file without usable timestamps gets the bare noun: the title
          // must not claim a time of day the file does not carry.
          setSlugBase(null);
          suggestTitle(capitalizeQuickWorkoutNoun(noun));
          return;
        }

        const startAt = new Date(parsed.startAt);
        // The file's own local offset is the recording's wall-clock. A file
        // that names none — naive, or written in UTC, which says nothing
        // about the wall-clock the owner recorded in — leaves the device's
        // own clock as the only reference there is.
        const localOffsetMinutes = toLocalRecordingOffsetMinutes(parsed.utcOffsetMinutes);
        const daypart = getQuickWorkoutDaypart(startAt, localOffsetMinutes);
        const adjective = t(`${wordingPrefix}.dayparts.${daypart}`);

        suggestTitle(`${adjective} ${noun}`);
        setSlugBase(
          buildQuickWorkoutSlugBase({
            activityTypeKey: activityType.key,
            startAt,
            utcOffsetMinutes: localOffsetMinutes,
          }),
        );
      });
    },
    [activityType.key, noun, suggestTitle, t, wordingPrefix],
  );

  const handleUploadComplete = useCallback(
    ({ fileAssetId: uploadedFileAssetId, fileName: uploadedFileName }: { fileAssetId: string; fileName: string }) => {
      setFileAssetId(uploadedFileAssetId);
      setFileName(uploadedFileName);
      setUploadError(null);
      setIsUploading(false);
      discardGuard.registerUploadedFileAssetId(uploadedFileAssetId);
    },
    [discardGuard],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!fileAssetId) {
      toast.error(t("quickWorkout.fileRequired"));
      return;
    }

    setIsSaving(true);

    try {
      const result = await createQuickWorkout({
        fileAssetId,
        activityTypeId: activityType.id,
        title: values.title,
        slug: slugBase,
        gearId: values.gearId || null,
        // feature-124: the owner asked for this gear to become the preferred
        // one for this activity type. The server writes the preference in the
        // same transaction as the workout.
        rememberGearAsPreferred: values.rememberGear === true,
        // The fallback for a file that names no UTC offset: the device that
        // wrote it is then the only reference there is. The server validates
        // the value before it stores it.
        deviceTimezone: deviceTimeZone,
      });

      if (!result.ok) {
        // The refusal is reported with the wording the track form uses for the
        // same refusal; a validation refusal carries the reason the server
        // gave, because it is about this upload.
        const messageByCode = {
          TRUST: t("addTrackError"),
          QUOTA: t("addTrackQuotaReached"),
          SLUG: t("addTrackError"),
          VALIDATION: result.message,
          INTERNAL: t("quickWorkout.error"),
        };

        toast.error(messageByCode[result.code] || result.message);
        return;
      }

      toast.success(t("quickWorkout.success"));
      discardGuard.closeWithoutGuard();
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("quickWorkout.error"));
    } finally {
      setIsSaving(false);
    }
  });

  // feature-146: the route mode's save. The title and the slug come from the
  // entered start the same way the file mode takes them from the file, and
  // the walk is published right away.
  const handleRouteSubmit = routeForm.handleSubmit(async (values) => {
    const startAt = new Date(values.recordingStartAt);

    if (Number.isNaN(startAt.getTime())) {
      toast.error(t("quickWorkout.routeMode.error"));
      return;
    }

    const minutes = Number(values.durationMinutes);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error(t("quickWorkout.routeMode.error"));
      return;
    }

    const daypart = getQuickWorkoutDaypart(startAt, null);
    const adjective = t(`${wordingPrefix}.dayparts.${daypart}`);
    const title = adjective ? `${adjective} ${noun}` : capitalizeQuickWorkoutNoun(noun);
    const slug = buildQuickWorkoutSlugBase({
      activityTypeKey: activityType.key,
      startAt,
      utcOffsetMinutes: null,
    });

    setIsSaving(true);

    try {
      const result = await createQuickRouteWorkout({
        routeId: values.routeId,
        activityTypeId: activityType.id,
        title,
        slug,
        gearId: values.gearId || null,
        // The entered value is a wall clock with no offset: the server reads
        // it in the device's own zone.
        recordingStartAt: values.recordingStartAt,
        durationMinutes: minutes,
        deviceTimezone: deviceTimeZone,
      });

      if (!result.ok) {
        // The same vocabulary as the file mode: the shared refusals speak in
        // the track form's wording, and a validation refusal carries the
        // reason the server gave.
        const messageByCode = {
          TRUST: t("addTrackError"),
          QUOTA: t("addTrackQuotaReached"),
          SLUG: t("addTrackError"),
          VALIDATION: result.message,
          INTERNAL: t("quickWorkout.routeMode.error"),
        };

        toast.error(messageByCode[result.code] || result.message);
        return;
      }

      toast.success(t("quickWorkout.routeMode.success"));
      discardGuard.closeWithoutGuard();
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("quickWorkout.routeMode.error"));
    } finally {
      setIsSaving(false);
    }
  });

  // The preview reads the start in the recording's own timezone — the file's
  // local offset when it names one, and the device's zone otherwise. Reading
  // it in the device's zone alone would show a Moscow recording in Sofia
  // time; a file written in UTC names the instant and not the wall-clock, so
  // it falls to the device's zone as well.
  const previewZone = useMemo(() => {
    if (!preview) return null;

    const localOffsetMinutes = toLocalRecordingOffsetMinutes(preview.utcOffsetMinutes);

    return (localOffsetMinutes === null ? null : formatFixedUtcOffset(localOffsetMinutes)) ?? deviceTimeZone;
  }, [deviceTimeZone, preview]);

  const statsText = preview
    ? t("quickWorkout.statsSummary", {
        distance: formatTrackDistance(preview.distanceMeters) ?? "—",
        duration: formatTrackDuration(preview.durationSeconds) ?? "—",
        start: formatTrackRecordingDateTime(preview.startAt, previewZone) ?? "—",
      })
    : null;

  // feature-146: the route mode saves only a complete form — a route, a start
  // and a duration. Without a parsed route there is nothing to save.
  const routeSaveEnabled = Boolean(
    routeValues.routeId && routeValues.recordingStartAt && Number(routeValues.durationMinutes) > 0,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={discardGuard.handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "gpx" ? t(`${wordingPrefix}.addLabel`) : t("quickWorkout.routeMode.title")}
            </DialogTitle>
          </DialogHeader>
          {mode === "gpx" ? (
            <Form {...form}>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label>{t("quickWorkout.fileLabel")}</Label>
                  <TrackGpxUploadSection
                    isEditing={false}
                    onBeforeUpload={handleBeforeUpload}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={() => {
                      // toast already emitted by the section
                      setUploadError(t("addTrackUploadError"));
                      setIsUploading(false);
                    }}
                  />
                  {uploadError ? <p className="text-destructive text-sm">{uploadError}</p> : null}
                  {fileName || statsText ? (
                    <p className="text-muted-foreground text-sm">
                      {fileName ? <span className="block">{fileName}</span> : null}
                      {statsText ? <span className="block">{statsText}</span> : null}
                    </p>
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quickWorkout.titleLabel")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <FormLabel>{t("quickWorkout.gearLabel")}</FormLabel>
                        <TrackGearSelect
                          value={field.value}
                          onChange={field.onChange}
                          gear={fittingGear}
                          activityTypeId={activityType.id}
                          noneLabel={t("quickWorkout.gearNone")}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : ownerGear.length > 0 ? (
                  <p className="text-muted-foreground text-sm">{t("quickWorkout.gearEmpty")}</p>
                ) : null}

                {/* feature-124: the control is offered only when a gear item is
                  attached — there is nothing to remember otherwise. */}
                {selectedGearId ? (
                  <FormField
                    control={form.control}
                    name="rememberGear"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              name={field.name}
                              ref={field.ref}
                              checked={field.value === true}
                              onChange={(event) => field.onChange(event.target.checked)}
                              onBlur={field.onBlur}
                              disabled={isSaving}
                              className="size-4 accent-primary"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{rememberGearLabel}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                ) : null}

                <DialogFooter>
                  {/* feature-146: the route mode is offered next to Save. It is
                      disabled while a file is uploaded or uploading — the two
                      are alternatives.
                      feature-140: it is offered for walking only. */}
                  {isWalking ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving || isUploading || Boolean(fileAssetId)}
                      onClick={() => setMode("route")}
                    >
                      {t("quickWorkout.routeMode.action")}
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? t("quickWorkout.saving") : t("quickWorkout.save")}
                  </Button>
                </DialogFooter>
                {isWalking && (isUploading || fileAssetId) ? (
                  <p className="text-muted-foreground text-sm">{t("quickWorkout.routeMode.sourceHint")}</p>
                ) : null}
              </form>
            </Form>
          ) : (
            <Form {...routeForm}>
              <form onSubmit={handleRouteSubmit} className="grid gap-4">
                {parsedRoutes.length === 0 ? (
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">{t("quickWorkout.routeMode.emptyTitle")}</p>
                    <p className="text-muted-foreground text-sm">{t("quickWorkout.routeMode.emptyHint")}</p>
                    <Button asChild variant="outline" className="w-fit">
                      <Link href="/my/routes">{t("quickWorkout.routeMode.emptyLink")}</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={routeForm.control}
                      name="routeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quickWorkout.routeMode.routeLabel")}</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quickWorkout.routeMode.routePlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              {parsedRoutes.map((route) => (
                                <SelectItem key={route.id} value={route.id}>
                                  {route.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={routeForm.control}
                      name="recordingStartAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quickWorkout.routeMode.startLabel")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={routeForm.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("quickWorkout.routeMode.durationLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0.1"
                              step="0.1"
                              inputMode="decimal"
                              placeholder={t("quickWorkout.routeMode.durationPlaceholder")}
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {fittingGear.length > 0 ? (
                      <FormField
                        control={routeForm.control}
                        name="gearId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("quickWorkout.routeMode.gearLabel")}</FormLabel>
                            <TrackGearSelect
                              value={field.value}
                              onChange={field.onChange}
                              gear={fittingGear}
                              activityTypeId={activityType.id}
                              noneLabel={t("quickWorkout.routeMode.gearNone")}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : ownerGear.length > 0 ? (
                      <p className="text-muted-foreground text-sm">{t("quickWorkout.routeMode.gearEmpty")}</p>
                    ) : null}
                  </>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" disabled={isSaving} onClick={() => setMode("gpx")}>
                    {t("quickWorkout.routeMode.back")}
                  </Button>
                  <Button type="submit" disabled={isSaving || !routeSaveEnabled}>
                    {isSaving ? t("quickWorkout.routeMode.saving") : t("quickWorkout.routeMode.save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...discardGuard.confirmDialogProps} />
    </>
  );
};

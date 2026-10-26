"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useT } from "next-i18next/client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { createQuickWorkout } from "@/app/_data/tracks";
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
} from "@/components/index";
import { Label } from "@/components/ui/label";
import { TrackGearSelect, type TrackGearOption } from "@/components/track-pages/track-gear-select";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { gearFitsActivityType } from "@/lib/gear";
import { buildQuickWorkoutSlugBase, capitalizeQuickWorkoutNoun, getQuickWorkoutDaypart } from "@/lib/quick-workout";
import { formatTrackDistance, formatTrackDuration, formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { parseTrackGpxPreview, type TrackGpxPreview } from "@/lib/track-gpx-parser";
import { formatFixedUtcOffset } from "@/lib/track-recording-timezone";
import { useDiscardGuardedTrackForm } from "@/lib/use-discard-guarded-track-form";

// feature-123: the one-click quick upload.
//
// The dialog collects three things — a GPX file, a title, and optionally a
// pair of gear — and fills in everything else. It is parameterized by the
// activity type, so the next quick-add button is a wording entry and a
// prop, not a second component.

const quickWorkoutSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  gearId: z.string().optional(),
});

type QuickWorkoutFormValues = z.infer<typeof quickWorkoutSchema>;

export type QuickWorkoutActivityType = {
  id: string;
  key: string;
};

export const QuickWorkoutUploadDialog = ({
  activityType,
  ownerGear,
  open,
  onOpenChange,
  onSaved,
}: {
  activityType: QuickWorkoutActivityType;
  ownerGear: TrackGearOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) => {
  const { i18n, t } = useT(tripsNamespace);
  const [fileAssetId, setFileAssetId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<TrackGpxPreview | null>(null);
  const [slugBase, setSlugBase] = useState<string | null>(null);
  const [browserTimeZone, setBrowserTimeZone] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // The title the dialog suggested last. The owner's own wording is never
  // overwritten — only a previous suggestion is replaced by a new one.
  const suggestedTitleRef = useRef<string | null>(null);

  const form = useForm<QuickWorkoutFormValues>({
    resolver: zodResolver(quickWorkoutSchema),
    defaultValues: { title: "", gearId: "" },
    mode: "onBlur",
  });

  const wordingPrefix = `quickWorkout.activities.${activityType.key}`;
  const noun = i18n.exists(`${wordingPrefix}.noun`, { ns: tripsNamespace })
    ? t(`${wordingPrefix}.noun`)
    : capitalizeQuickWorkoutNoun(activityType.key);

  const resetFormState = useCallback(() => {
    form.reset({ title: "", gearId: "" });
    suggestedTitleRef.current = null;
    setFileAssetId(null);
    setFileName(null);
    setPreview(null);
    setSlugBase(null);
    setBrowserTimeZone(null);
    setUploadError(null);
  }, [form]);

  const discardGuard = useDiscardGuardedTrackForm({
    hasUnsavedChanges: form.formState.isDirty,
    resetFormState,
    onOpenChange,
    discardedMsg: "Uploaded GPX file discarded",
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
        setBrowserTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? null);

        if (!parsed.startAt) {
          // A file without usable timestamps gets the bare noun: the title
          // must not claim a time of day the file does not carry.
          setSlugBase(null);
          suggestTitle(capitalizeQuickWorkoutNoun(noun));
          return;
        }

        const startAt = new Date(parsed.startAt);
        // The file's own offset is the recording's wall-clock. The device's
        // zone is the fallback for a file that names no offset — and there it
        // is also right, because a naive timestamp is the device's own clock.
        const daypart = getQuickWorkoutDaypart(startAt, parsed.utcOffsetMinutes);
        const adjective = t(`${wordingPrefix}.dayparts.${daypart}`);

        suggestTitle(`${adjective} ${noun}`);
        setSlugBase(
          buildQuickWorkoutSlugBase({
            activityTypeKey: activityType.key,
            startAt,
            utcOffsetMinutes: parsed.utcOffsetMinutes,
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
      discardGuard.registerUploadedFileAssetId(uploadedFileAssetId);
    },
    [discardGuard],
  );

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
        // The fallback for a file that names no UTC offset: the device that
        // wrote it is then the only reference there is. The server validates
        // the value before it stores it.
        deviceTimezone: browserTimeZone,
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

  // The preview reads the start in the recording's own timezone — the file's
  // offset when it names one, and the device's zone otherwise. Reading it in
  // the device's zone alone would show a Moscow recording in Sofia time.
  const previewZone = useMemo(() => {
    if (!preview) return null;

    return formatFixedUtcOffset(preview.utcOffsetMinutes) ?? browserTimeZone;
  }, [browserTimeZone, preview]);

  const statsText = preview
    ? t("quickWorkout.statsSummary", {
        distance: formatTrackDistance(preview.distanceMeters) ?? "—",
        duration: formatTrackDuration(preview.durationSeconds) ?? "—",
        start: formatTrackRecordingDateTime(preview.startAt, previewZone) ?? "—",
      })
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={discardGuard.handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t(`${wordingPrefix}.addLabel`)}</DialogTitle>
          </DialogHeader>
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

              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? t("quickWorkout.saving") : t("quickWorkout.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...discardGuard.confirmDialogProps} />
    </>
  );
};

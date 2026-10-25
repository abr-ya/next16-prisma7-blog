"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, MapPin, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { navigationNamespace, tripsNamespace } from "@/app/i18n/settings";
import type { GearListItem } from "@/app/_data/gear";
import {
  createManualTrack,
  createTrack,
  deleteTrack,
  markTrackAsManual,
  updateTrack,
  updateTrackRecordingMetadata,
  updateTrackRecordingTimezone,
  type TrackListItem,
} from "@/app/_data/tracks";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/index";
import type { TrackKind, TrackStatus } from "@/generated/prisma/enums";
import type { TrackActivityType } from "@/generated/prisma/client";
import { createSlug } from "@/lib/slug-generator";
import { useTrackRowActions } from "@/lib/track-row-actions";
import { useDeleteRowConfirm } from "@/lib/use-delete-row-confirm";
import { useDiscardGuardedTrackForm } from "@/lib/use-discard-guarded-track-form";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { TrackGearSelect } from "@/components/track-pages/track-gear-select";
import { TrackEditor, type ManualTrackPoint } from "@/components/track-pages/track-editor";
import { getSupportedTrackRecordingTimezones, normalizeTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import { trackStatusOptions } from "@/lib/tracks";
import {
  formatTrackDistance,
  formatTrackPointCount,
  formatTrackRecordingTimeRange,
  formatTrackTimezoneEvidence,
  formatTrackTimelinePresence,
} from "@/lib/track-gpx-metadata";
import {
  getParseStatusLabel,
  getParseStatusVariant,
  getTrackParseState,
} from "@/components/admin-pages/tracks-admin-panel-parse-cell";
import { createTracksAdminColumns } from "@/components/admin-pages/tracks-admin-columns";
import { createTrackWorkoutColumns } from "@/components/admin-pages/tracks-workout-columns";
import { TrackDurationInputError, parseDurationInput, parseStoredDurationToHms } from "@/lib/track-duration-input";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  // feature-120: the kind answers "what is this track for" — a routine
  // training session versus a route. It is a private owner-side label and
  // defaults to a route.
  kind: z.enum(["ROUTE", "TRAINING"]),
  // `fileAssetId` is required by the GPX-upload tab and left empty by the
  // Place on map tab (where the file asset is built server-side from the
  // placed points). The submit button enforces "tab-appropriate" non-empty
  // values per active tab.
  fileAssetId: z.string().optional(),
  fileAssetName: z.string().optional(),
  activityTypeId: z.string().optional(),
  // feature-122: the gear the track was run in. An empty selection is stored
  // as no gear; a form that never touched the field leaves the attachment
  // alone.
  gearId: z.string().optional(),
  // feature-112 Place on map tab fields. The form layer carries them as
  // strings so react-hook-form can manage a single text/datetime input per
  // component; parsing through `parseDurationInput` happens at submit time
  // and `timeSource` is derived live from these values for the badge.
  recordingStartAt: z.string().optional(),
  recordingTimezone: z.string().optional(),
  recordingDurationHours: z.string().optional(),
  recordingDurationMinutes: z.string().optional(),
  recordingDurationSeconds: z.string().optional(),
  includeSeconds: z.boolean().optional(),
});

type TrackFormValues = z.infer<typeof formSchema>;

type TrackCreationMode = "gpx" | "placeOnMap";

const TRACK_FORM_DEFAULTS: TrackFormValues = {
  title: "",
  slug: "",
  description: "",
  status: "DRAFT",
  kind: "ROUTE",
  fileAssetId: "",
  fileAssetName: "",
  activityTypeId: "",
  gearId: "",
  recordingStartAt: "",
  recordingTimezone: "",
  recordingDurationHours: "0",
  recordingDurationMinutes: "0",
  recordingDurationSeconds: "0",
  includeSeconds: false,
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const formatActivityTypeName = (activityType: TrackActivityType | null, language?: string) =>
  activityType ? (language === "ru" ? activityType.nameRu || activityType.nameEn : activityType.nameEn) : "";

const TrackFormDialog = ({
  track,
  activityTypes,
  ownerGear,
  open,
  onOpenChange,
  onParse,
  parsingTrackId,
  onSaved,
  defaultKind = "ROUTE",
}: {
  track: TrackListItem | null;
  activityTypes: TrackActivityType[];
  // feature-122: the owner's own gear. The field is rendered only when the
  // caller has gear to offer — the administrative panel has none, so it
  // cannot show the control at all.
  ownerGear?: GearListItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParse: (track: TrackListItem) => void;
  parsingTrackId: string | null;
  onSaved: () => void;
  // feature-120: the kind a NEW track starts with. "My workouts" passes
  // "TRAINING"; everywhere else a track starts as a route. The saved kind of
  // an edited track always wins over this default.
  defaultKind?: TrackKind;
}) => {
  const { i18n, t } = useT(tripsNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  // feature-120: the form defaults are per-instance, because the new-track
  // default kind depends on the page the dialog was opened from.
  const defaultValues = useMemo(() => ({ ...TRACK_FORM_DEFAULTS, kind: defaultKind }), [defaultKind]);
  const form = useForm<TrackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });
  const isEditing = Boolean(track);
  const parseState = track ? getTrackParseState(track) : null;
  const isParsing = Boolean(track && parsingTrackId === track.id);
  // feature-116: the four recording-metadata inputs (start / timezone / duration
  // trio) are read-only when the saved row is GPX-sourced — the values come
  // from the parsed file and cannot be edited. MANUAL and NONE rows keep the
  // editable behaviour so an owner can fill the fields and save.
  const isReadOnlyRecording = track?.timeSource === "GPX";
  // feature-116 follow-up: legacy GPX-sourced rows whose `timeSource` was
  // re-asserted by an older `parseTrackGpx` call can be reclassified to
  // `MANUAL` from the admin form when at least one recording-metadata
  // column is non-null. The button is hidden otherwise to keep the
  // "explicit owner intent" contract.
  const canMarkAsManual =
    Boolean(track) &&
    track?.timeSource === "GPX" &&
    (track.recordingStartAt !== null ||
      track.recordingDurationSeconds !== null ||
      (track.recordingTimezone !== null && track.recordingTimezone.length > 0));
  const savedFileAssetId = track?.fileAssetId ?? null;
  const fileAssetId = useWatch({ control: form.control, name: "fileAssetId" });
  const fileAssetName = useWatch({ control: form.control, name: "fileAssetName" });
  const [activeTab, setActiveTab] = useState<TrackCreationMode>("gpx");
  const [placedPoints, setPlacedPoints] = useState<ManualTrackPoint[]>([]);
  const [isMarkingAsManual, setIsMarkingAsManual] = useState(false);
  const [markAsManualError, setMarkAsManualError] = useState<string | null>(null);
  // Track the previous `open` value so we can reset local UI state during
  // render (instead of in an effect) when the dialog flips closed → open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setActiveTab("gpx");
      setPlacedPoints([]);
    }
  }
  const resetFormState = useCallback(() => {
    setPlacedPoints([]);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const discardGuard = useDiscardGuardedTrackForm({
    savedFileAssetId,
    hasUnsavedChanges: form.formState.isDirty,
    hasUnsavedPoints: placedPoints.length > 0,
    resetFormState,
    onOpenChange,
    discardedMsg: "Uploaded GPX file discarded",
  });

  useEffect(() => {
    if (!open) return;

    if (track) {
      // feature-116: pre-fill the four recording-metadata fields from the saved
      // row so re-opening the dialog shows the values the owner typed the
      // last time (for MANUAL / NONE) or the values the parser wrote
      // (for GPX). The submit handler decides whether to dispatch the new
      // `updateTrackRecordingMetadata` action; the form renders the inputs
      // read-only for GPX rows via the `isReadOnlyRecording` flag.
      const storedDuration = parseStoredDurationToHms(track.recordingDurationSeconds);
      const startWallClock = track.recordingStartAt ? track.recordingStartAt.toISOString().slice(0, 16) : "";
      form.reset({
        title: track.title,
        slug: track.slug,
        description: track.description ?? "",
        status: track.status,
        // feature-120: restore the saved kind, otherwise opening a workout
        // in the edit dialog would show "Route" and saving would demote it.
        kind: track.kind,
        fileAssetId: track.fileAssetId,
        fileAssetName: track.fileAsset.name,
        activityTypeId: track.activityTypeId ?? "",
        // feature-122: the attached gear, read from the row the table was
        // built from — no second query for it.
        gearId: track.gear?.id ?? "",
        recordingStartAt: startWallClock,
        recordingTimezone: track.recordingTimezone ?? "",
        recordingDurationHours: storedDuration.hours,
        recordingDurationMinutes: storedDuration.minutes,
        recordingDurationSeconds: storedDuration.seconds,
        includeSeconds: storedDuration.includeSeconds,
      });
    } else {
      // feature-120: a new track starts with the page's default kind — a
      // route on My tracks and the admin panel, a workout on My workouts.
      form.reset(defaultValues);
    }
  }, [form, track, open, defaultValues]);

  const titleValue = useWatch({ control: form.control, name: "title" });
  // feature-122: the gear list narrows itself to the activity type the form
  // carries at the moment.
  const activityTypeIdValue = useWatch({ control: form.control, name: "activityTypeId" }) ?? "";
  // feature-112 Place on map metadata. `useWatch` re-renders the timeSource
  // badge and duration layout as the user edits the inputs, mirroring the
  // server-side derivation in `createManualTrack`.
  const recordingStartAtValue = useWatch({ control: form.control, name: "recordingStartAt" }) ?? "";
  const recordingDurationHoursValue = useWatch({ control: form.control, name: "recordingDurationHours" }) ?? "0";
  const recordingDurationMinutesValue = useWatch({ control: form.control, name: "recordingDurationMinutes" }) ?? "0";
  const recordingDurationSecondsValue = useWatch({ control: form.control, name: "recordingDurationSeconds" }) ?? "0";
  const includeSecondsValue = Boolean(useWatch({ control: form.control, name: "includeSeconds" }));
  const recordingTimezoneOptions = useMemo(() => getSupportedTrackRecordingTimezones(), []);
  const hasStart = recordingStartAtValue.trim().length > 0;
  const hasDuration =
    Number(recordingDurationHoursValue) > 0 ||
    Number(recordingDurationMinutesValue) > 0 ||
    (includeSecondsValue && Number(recordingDurationSecondsValue) > 0);
  const liveTimeSourceBadge: { variant: "secondary" | "outline"; label: string } =
    hasStart || hasDuration
      ? { variant: "secondary", label: t("placeOnMapTimeSourceManual") }
      : { variant: "outline", label: t("placeOnMapTimeSourceNone") };

  const handleGenerateSlug = () => {
    const slug = createSlug(titleValue);

    if (slug) {
      form.setValue("slug", slug, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleMarkAsManual = useCallback(async () => {
    if (!track) {
      return;
    }
    setIsMarkingAsManual(true);
    setMarkAsManualError(null);
    try {
      const result = await markTrackAsManual({ id: track.id });
      if (!result.ok) {
        setMarkAsManualError(result.message);
        return;
      }
      toast.success(t("trackMarkAsManualSuccess"));
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setMarkAsManualError(error instanceof Error ? error.message : "Failed to mark track as manual");
    } finally {
      setIsMarkingAsManual(false);
    }
  }, [track, t, onOpenChange, onSaved]);

  const cleanupSupersededUploads = async (savedFileId: string) => {
    const supersededFileIds = discardGuard.discardableFileAssetIds.filter(
      (uploadedFileAssetId) => uploadedFileAssetId !== savedFileId,
    );

    if (supersededFileIds.length === 0) return;

    const result = await markDiscardedTrackGpxFileAssetsPendingDelete(supersededFileIds);

    if (!result.success) {
      toast.error(result.message || "Earlier uploaded GPX file could not be removed");
    }
  };

  const onSubmit = async (values: TrackFormValues) => {
    const trackPayload = {
      title: values.title,
      slug: values.slug,
      description: values.description,
      status: values.status as TrackStatus,
      fileAssetId: values.fileAssetId,
      activityTypeId: values.activityTypeId || null,
      kind: values.kind,
      // feature-122: the gear field has three states. A form that never
      // touched it leaves the attachment alone, a cleared selection clears
      // it, a picked item attaches it.
      ...(form.formState.dirtyFields.gearId ? { gearId: values.gearId || null } : {}),
    };

    try {
      if (track) {
        await updateTrack({
          id: track.id,
          ...trackPayload,
        });

        // feature-116: when the saved row is MANUAL- or NONE-sourced, dispatch
        // the new `updateTrackRecordingMetadata` action with the four
        // recording-metadata fields the form collected. The server action is
        // timeSource-preserving (so a NONE row stays NONE even after the
        // owner populates fields) and it validates through the same
        // `parseManualTrackStartAt` / `parseDurationSeconds` helpers the
        // create path uses. GPX rows skip the dispatch entirely — the
        // columns come from the parsed GPX and the server action would
        // reject the call.
        if (track.timeSource !== "GPX") {
          const trimmedStart = values.recordingStartAt?.trim() ?? "";
          const trimmedTimezone = values.recordingTimezone?.trim() ?? "";
          const hasStart = trimmedStart.length > 0;
          const hasTimezone = trimmedTimezone.length > 0;
          const durationHours = Number(values.recordingDurationHours ?? "0");
          const durationMinutes = Number(values.recordingDurationMinutes ?? "0");
          const durationSecondsInput =
            values.includeSeconds && values.recordingDurationSeconds !== undefined
              ? Number(values.recordingDurationSeconds)
              : undefined;
          const hasDuration =
            Number.isFinite(durationHours) && durationHours > 0
              ? true
              : Number.isFinite(durationMinutes) && durationMinutes > 0
                ? true
                : durationSecondsInput !== undefined &&
                  Number.isFinite(durationSecondsInput) &&
                  durationSecondsInput > 0;

          let parsedStartInput: string | null = null;
          let parsedDurationInput: number | null = null;
          if (hasStart) {
            parsedStartInput = trimmedStart;
          }
          if (hasDuration) {
            try {
              parsedDurationInput = parseDurationInput({
                hours: Number.isFinite(durationHours) ? durationHours : 0,
                minutes: Number.isFinite(durationMinutes) ? durationMinutes : 0,
                seconds: durationSecondsInput,
              });
            } catch (error) {
              if (error instanceof TrackDurationInputError) {
                toast.error(error.message);
                return;
              }
              throw error;
            }
          }

          const result = await updateTrackRecordingMetadata({
            id: track.id,
            recordingStartAt: parsedStartInput,
            recordingDurationSeconds: parsedDurationInput,
            recordingTimezone: hasTimezone ? trimmedTimezone : null,
          });

          if (!result.ok) {
            toast.error(result.message);
            return;
          }
        }

        toast.success("Track updated");
      } else if (activeTab === "placeOnMap") {
        if (placedPoints.length < 2) {
          toast.error(t("trackEditorMinimumPoints"));
          return;
        }

        // Parse the feature-112 metadata at submit time so the typed
        // `parseDurationInput` / `parseManualTrackStartAt` helpers run before
        // we touch `createManualTrack`. `timeSource` is derived server-side
        // from the parsed fields so the client only sends the scalar inputs.
        const trimmedStart = values.recordingStartAt?.trim() ?? "";
        const trimmedTimezone = values.recordingTimezone?.trim() ?? "";
        const hasStart = trimmedStart.length > 0;
        const hasTimezone = trimmedTimezone.length > 0;
        const durationHours = Number(values.recordingDurationHours ?? "0");
        const durationMinutes = Number(values.recordingDurationMinutes ?? "0");
        const durationSecondsInput =
          values.includeSeconds && values.recordingDurationSeconds !== undefined
            ? Number(values.recordingDurationSeconds)
            : undefined;
        const hasDuration =
          Number.isFinite(durationHours) && durationHours > 0
            ? true
            : Number.isFinite(durationMinutes) && durationMinutes > 0
              ? true
              : durationSecondsInput !== undefined && Number.isFinite(durationSecondsInput) && durationSecondsInput > 0;

        let parsedDurationSeconds: number | null = null;
        if (hasDuration) {
          try {
            parsedDurationSeconds = parseDurationInput({
              hours: Number.isFinite(durationHours) ? durationHours : 0,
              minutes: Number.isFinite(durationMinutes) ? durationMinutes : 0,
              seconds: durationSecondsInput,
            });
          } catch (error) {
            if (error instanceof TrackDurationInputError) {
              toast.error(error.message);
              return;
            }
            throw error;
          }
        }

        const result = await createManualTrack({
          title: values.title,
          slug: values.slug,
          description: values.description ?? null,
          status: values.status,
          points: placedPoints,
          activityTypeId: values.activityTypeId?.trim() || null,
          kind: values.kind,
          gearId: values.gearId || null,
          recordingStartAt: hasStart ? trimmedStart : null,
          recordingDurationSeconds: parsedDurationSeconds,
          recordingTimezone: hasTimezone ? trimmedTimezone : null,
        });

        if (!result.ok) {
          const messageKey =
            result.code === "TRUST"
              ? "placeOnMapErrorTrust"
              : result.code === "QUOTA"
                ? "placeOnMapErrorQuota"
                : result.code === "SLUG"
                  ? "placeOnMapErrorSlug"
                  : result.code === "VALIDATION"
                    ? "placeOnMapErrorValidation"
                    : "placeOnMapErrorInternal";
          toast.error(t(messageKey) || result.message);
          return;
        }

        toast.success(t("placeOnMapSuccess"));
        setPlacedPoints([]);
        discardGuard.closeWithoutGuard();
        onSaved();
        return;
      } else {
        await createTrack(trackPayload);
        toast.success("Track created");
      }

      await cleanupSupersededUploads(values.fileAssetId ?? "");
      discardGuard.closeWithoutGuard();
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save track");
    }
  };

  const renderTextFields = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activityTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity type</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "unclassified" ? "" : value)}
                value={field.value || "unclassified"}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unclassified">{t("placeOnMapActivityTypeUnclassified")}</SelectItem>
                  {activityTypes.map((activityType) => (
                    <SelectItem key={activityType.id} value={activityType.id}>
                      {formatActivityTypeName(activityType, activeLanguage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* feature-122: the gear the owner ran the track in. The control
            exists only where the owner is the only audience — the
            administrative panel has no gear to offer and never renders it. */}
        {ownerGear ? (
          <FormField
            control={form.control}
            name="gearId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gear</FormLabel>
                <TrackGearSelect
                  value={field.value}
                  onChange={field.onChange}
                  gear={ownerGear}
                  activityTypeId={activityTypeIdValue || null}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                  Generate
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* feature-120: the kind is a private owner-side label — a routine
            training session versus a route. It is not offered in the
            trip-side dialog: a track inside a trip is a route. */}
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Track kind</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ROUTE">Route</SelectItem>
                  <SelectItem value="TRAINING">Workout</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* feature-112 Place on map tab fields. Rendered for both tabs per
          design decision 4 (the slot is shared) — the values are optional and
          only consumed by `createManualTrack`; on the GPX tab the upload
          itself supplies any time-related metadata via `parseTrackGpx`.
          feature-116: when the saved row is GPX-sourced (`isReadOnlyRecording`),
          the four inputs render read-only with a "from file" hint and the
          include-seconds toggle is disabled. */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="recordingStartAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("placeOnMapRecordingStartLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                  placeholder="2026-10-12T09:30"
                  autoComplete="off"
                  readOnly={isReadOnlyRecording}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recordingTimezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="place-on-map-recording-timezone">{t("placeOnMapRecordingTimezoneLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="place-on-map-recording-timezone"
                  list="place-on-map-recording-timezone-options"
                  placeholder="Europe/Sofia"
                  autoComplete="off"
                  readOnly={isReadOnlyRecording}
                />
              </FormControl>
              <datalist id="place-on-map-recording-timezone-options">
                {recordingTimezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone} />
                ))}
              </datalist>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{t("placeOnMapRecordingDurationLabel")}</span>
          <Button
            type="button"
            variant={includeSecondsValue ? "default" : "outline"}
            size="sm"
            aria-pressed={Boolean(includeSecondsValue)}
            disabled={isReadOnlyRecording}
            onClick={() =>
              form.setValue("includeSeconds", !includeSecondsValue, {
                shouldDirty: true,
              })
            }
          >
            {t("placeOnMapRecordingDurationIncludeSeconds")}
          </Button>
        </div>
        <div className={`grid gap-2 ${includeSecondsValue ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <FormField
            control={form.control}
            name="recordingDurationHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("placeOnMapRecordingDurationHours")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={24}
                    step={1}
                    readOnly={isReadOnlyRecording}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recordingDurationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("placeOnMapRecordingDurationMinutes")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    step={1}
                    readOnly={isReadOnlyRecording}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {includeSecondsValue ? (
            <FormField
              control={form.control}
              name="recordingDurationSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("placeOnMapRecordingDurationSeconds")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={59}
                      step={1}
                      readOnly={isReadOnlyRecording}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
        {isReadOnlyRecording ? (
          <p className="text-xs text-muted-foreground">{t("trackRecordingMetadataFromFileHint")}</p>
        ) : null}
        {canMarkAsManual ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isMarkingAsManual} onClick={handleMarkAsManual}>
              {t("trackMarkAsManualButton")}
            </Button>
            {markAsManualError ? <span className="text-xs text-destructive">{markAsManualError}</span> : null}
          </div>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("placeOnMapTimeSourceLabel")}:</span>
          <Badge variant={liveTimeSourceBadge.variant}>{liveTimeSourceBadge.label}</Badge>
        </div>
      </div>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {trackStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const canSubmit = isEditing
    ? Boolean(fileAssetId)
    : activeTab === "gpx"
      ? Boolean(fileAssetId)
      : placedPoints.length >= 2;

  return (
    <>
      <Dialog open={open} onOpenChange={discardGuard.handleOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit track" : "Create track"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TrackCreationMode)}
                className="gap-4"
              >
                {!isEditing ? (
                  <TabsList>
                    <TabsTrigger value="gpx">
                      <FileUp />
                      {t("uploadGpxTab")}
                    </TabsTrigger>
                    <TabsTrigger value="placeOnMap">
                      <MapPin />
                      {t("placeOnMapTab")}
                    </TabsTrigger>
                  </TabsList>
                ) : null}
                <TabsContent value="gpx" className="grid gap-4">
                  {renderTextFields()}
                  <FormField
                    control={form.control}
                    name="fileAssetId"
                    render={() => (
                      <FormItem>
                        <FormLabel>GPX file</FormLabel>
                        <div className="rounded-md border p-3 text-sm">
                          <div className="flex min-h-5 items-center gap-2">
                            <FileUp className="size-4 text-muted-foreground" />
                            <span className="truncate">{fileAssetName || "No GPX file uploaded"}</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <TrackGpxUploadSection
                    isEditing={isEditing}
                    onUploadComplete={({ fileAssetId, fileName }) => {
                      form.setValue("fileAssetId", fileAssetId, { shouldDirty: true, shouldValidate: true });
                      form.setValue("fileAssetName", fileName, { shouldDirty: true, shouldValidate: true });
                      discardGuard.registerUploadedFileAssetId(fileAssetId);
                    }}
                    onUploadError={() => {
                      // toast already emitted by the section
                    }}
                  />
                  {track && parseState ? (
                    <div className="grid gap-3 rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">GPX parsing</span>
                          <Badge variant={getParseStatusVariant(parseState)}>{getParseStatusLabel(parseState)}</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isParsing || form.formState.isDirty}
                          onClick={() => onParse(track)}
                        >
                          <RefreshCw className={isParsing ? "animate-spin" : undefined} />
                          {isParsing ? "Parsing..." : parseState.status === "SUCCESS" ? "Reparse" : "Parse GPX"}
                        </Button>
                      </div>
                      {parseState.status === "SUCCESS" ? (
                        <div className="grid gap-2 text-muted-foreground">
                          <div className="flex flex-wrap gap-3">
                            <span>{formatTrackDistance(parseState.summary.distanceMeters)}</span>
                            <span>{formatTrackPointCount(parseState.summary.points)}</span>
                            <span>{formatTrackTimelinePresence(parseState.timeline)}</span>
                            <span>Parsed {formatDate(parseState.metadata.gpxParse.parsedAt)}</span>
                          </div>
                          {parseState.summary.time ? (
                            <div className="flex flex-wrap gap-2">
                              <span>
                                {formatTrackRecordingTimeRange(parseState.summary.time, track.recordingTimezone)}
                              </span>
                              <Badge
                                variant={
                                  parseState.summary.time.timezoneEvidence === "UTC_OR_OFFSET" ? "secondary" : "outline"
                                }
                              >
                                {formatTrackTimezoneEvidence(parseState.summary.time.timezoneEvidence)}
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {parseState.status === "FAILED" || parseState.status === "STALE" ? (
                        <div className="text-muted-foreground">{parseState.errorMessage}</div>
                      ) : null}
                      {form.formState.isDirty ? (
                        <div className="text-xs text-muted-foreground">
                          Save track changes before parsing the current GPX file.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </TabsContent>
                <TabsContent value="placeOnMap" className="grid gap-4">
                  <TrackEditor
                    initialPoints={[]}
                    onChangePoints={setPlacedPoints}
                    renderFormFields={renderTextFields}
                    mapAriaLabel={t("trackEditorMapAriaLabel")}
                  />
                </TabsContent>
              </Tabs>
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting || !canSubmit}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : !isEditing && activeTab === "placeOnMap"
                      ? t("placeOnMapCreate")
                      : "Save track"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...discardGuard.confirmDialogProps} />
    </>
  );
};

export const TrackManagementPanel = ({
  tracks,
  activityTypes,
  ownerGear,
  defaultKind = "ROUTE",
  tableVariant = "full",
}: {
  tracks: TrackListItem[];
  activityTypes: TrackActivityType[];
  // feature-122: the owner's own gear. The gear field is rendered only when
  // this prop is present, so a surface without gear — the administrative
  // panel — cannot show the control at all.
  ownerGear?: GearListItem[];
  // feature-120: the kind a new track starts with on this page. "My
  // workouts" passes "TRAINING"; My tracks and the admin panel keep the
  // default route.
  defaultKind?: TrackKind;
  // feature-120 follow-up: "My workouts" renders the short owner-side
  // table (badges, title, start, distance, type); every other page keeps
  // the full admin column set.
  tableVariant?: "full" | "workouts";
}) => {
  const router = useRouter();
  const { i18n } = useT(navigationNamespace);
  const { t } = useT(tripsNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackListItem | null>(null);
  const [timezoneTarget, setTimezoneTarget] = useState<TrackListItem | null>(null);
  const [recordingTimezone, setRecordingTimezone] = useState("");
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  const [isSavingTimezone, startSavingTimezone] = useTransition();

  const rowActions = useTrackRowActions({
    onSuccess: () => router.refresh(),
  });

  const deleteConfirm = useDeleteRowConfirm<TrackListItem>({
    deleteAction: deleteTrack,
    title: "Delete track?",
    getDescription: (row) =>
      `This will remove "${row.title}" from ${tableVariant === "workouts" ? "My workouts" : "the tracks list"}.`,
    deletedMsg: "Track deleted",
    notFoundMsg: "Track not found",
  });

  const timezoneOptions = useMemo(() => getSupportedTrackRecordingTimezones(), []);

  // The two effects below are pre-existing patterns that the new
  // eslint-plugin-react-hooks v7 (React Compiler) flags as
  // "set-state-in-effect"; the eslint-disable block suppresses the rule
  // for the effect bodies without changing the runtime behaviour. The
  // refactor scope is the panel split, not these effects.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const detected = normalizeTrackRecordingTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    setBrowserTimezone(detected);
  }, []);

  useEffect(() => {
    if (!timezoneTarget) return;

    setRecordingTimezone(timezoneTarget.recordingTimezone ?? browserTimezone ?? "UTC");
  }, [browserTimezone, timezoneTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleEditTrack = useCallback((track: TrackListItem) => {
    setEditingTrack(track);
    setFormOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      tableVariant === "workouts"
        ? createTrackWorkoutColumns({
            activeLanguage,
            onEditTrack: handleEditTrack,
            onSetDeleteTarget: deleteConfirm.setTarget,
            formatActivityTypeName,
          })
        : createTracksAdminColumns({
            activeLanguage,
            handleParse: rowActions.handleParse,
            markingAsManualId: rowActions.markingAsManualId,
            onMarkAsManual: rowActions.setMarkAsManualTarget,
            onSetTimezoneTarget: setTimezoneTarget,
            onEditTrack: handleEditTrack,
            onSetDeleteTarget: deleteConfirm.setTarget,
            parsingTrackId: rowActions.parsingTrackId,
            t,
            formatDate,
            formatActivityTypeName,
          }),
    [activeLanguage, deleteConfirm.setTarget, handleEditTrack, rowActions, t, tableVariant],
  );

  // The inline column body that used to live here has moved to
  // `components/admin-pages/tracks-admin-columns.tsx` (feature-117).
  // The factory composes the column array from the closures above; the
  // `useMemo` keeps the same identity contract that the inline `useMemo`
  // had before the move.

  const handleTimezoneSave = () => {
    if (!timezoneTarget) return;

    const timezone = normalizeTrackRecordingTimezone(recordingTimezone);

    if (!timezone) {
      toast.error("Choose a supported IANA timezone");
      return;
    }

    startSavingTimezone(async () => {
      try {
        await updateTrackRecordingTimezone({ id: timezoneTarget.id, recordingTimezone: timezone });
        toast.success("Recording timezone saved");
        setTimezoneTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save recording timezone");
      }
    });
  };

  const handleCreateClick = () => {
    setEditingTrack(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleCreateClick}>
          <Plus />
          Add track
        </Button>
      </div>
      <DataTable data={tracks} columns={columns} pagination={{ pageSize: 10 }} />
      <TrackFormDialog
        track={editingTrack}
        activityTypes={activityTypes}
        ownerGear={ownerGear}
        open={formOpen}
        defaultKind={defaultKind}
        onParse={rowActions.handleParse}
        parsingTrackId={rowActions.parsingTrackId}
        onSaved={() => router.refresh()}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTrack(null);
        }}
      />
      <Dialog open={Boolean(timezoneTarget)} onOpenChange={(open) => !open && setTimezoneTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recording timezone</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1 text-sm">
              <span className="font-medium">{timezoneTarget?.title}</span>
              <span className="text-muted-foreground">
                This affects displayed recording times only. GPX timestamps and map coordinates stay unchanged.
              </span>
            </div>
            <div className="grid gap-2">
              <label htmlFor="track-recording-timezone" className="text-sm font-medium">
                IANA timezone
              </label>
              <Input
                id="track-recording-timezone"
                list="track-recording-timezone-options"
                value={recordingTimezone}
                onChange={(event) => setRecordingTimezone(event.target.value)}
                placeholder="Europe/Sofia"
                autoComplete="off"
              />
              <datalist id="track-recording-timezone-options">
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                {browserTimezone ? `Browser suggestion: ${browserTimezone}` : "Choose a supported IANA timezone."}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTimezoneTarget(null)}
                disabled={isSavingTimezone}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleTimezoneSave} disabled={isSavingTimezone}>
                {isSavingTimezone ? "Saving..." : "Save timezone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...deleteConfirm.confirmDialogProps} />
      <ConfirmDialog
        open={Boolean(rowActions.markAsManualTarget)}
        onOpenChange={(open) => {
          if (!open) rowActions.setMarkAsManualTarget(null);
        }}
        title={t("trackMarkAsManualConfirmTitle")}
        description={
          rowActions.markAsManualTarget
            ? `${t("trackMarkAsManualConfirmDescription")} (${rowActions.markAsManualTarget.title})`
            : undefined
        }
        confirmLabel={t("trackMarkAsManualConfirmButton")}
        confirmVariant="default"
        isPending={Boolean(rowActions.markingAsManualId)}
        onConfirm={rowActions.handleMarkAsManualConfirm}
      />
    </div>
  );
};

// Kept as a compatibility export for the existing administrator workspace route.
export const TracksAdminPanel = TrackManagementPanel;

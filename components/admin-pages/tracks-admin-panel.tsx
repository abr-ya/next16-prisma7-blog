"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Footprints,
  MapPin,
  NotebookPen,
  Plus,
  RefreshCw,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { navigationNamespace, tripsNamespace } from "@/app/i18n/settings";
import type { GearListItem, OwnerGearPreferences } from "@/app/_data/gear";
import { createRouteFromPoints, type RouteListItem } from "@/app/_data/routes";
import {
  createTrack,
  createTrackFromRoute,
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
import {
  formatIsoWeekRange,
  getIsoWeekForDate,
  getIsoWeekForTrack,
  getIsoWeekdayIndex,
  getIsoWeekRange,
  getIsoWeeksInYear,
  getTrackCalendarDate,
  type IsoWeekRef,
} from "@/lib/track-iso-week";
import {
  ALL_WORKOUT_PERIOD,
  formatWorkoutDateInput,
  getCurrentWorkoutMonthPeriod,
  getCurrentWorkoutYearPeriod,
  getWorkoutPeriodKey,
  isWorkoutPeriodPaginated,
  matchesWorkoutPeriod,
  parseWorkoutDateInput,
  shiftWorkoutPeriod,
  type WorkoutPeriod,
} from "@/lib/track-period";
import { useTrackRowActions } from "@/lib/track-row-actions";
import { useDeleteRowConfirm } from "@/lib/use-delete-row-confirm";
import { useDiscardGuardedTrackForm } from "@/lib/use-discard-guarded-track-form";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrackGearSelect } from "@/components/track-pages/track-gear-select";
import { QuickWorkoutUploadDialog } from "@/components/track-pages/quick-workout-upload-dialog";
import { DraftWorkoutDialog } from "@/components/track-pages/draft-workout-dialog";
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
import { WorkoutWeekSummary } from "@/components/admin-pages/workout-week-summary";
import type { WorkoutWeekDayPoint } from "@/components/admin-pages/workout-week-day-charts";
import {
  TrackDurationInputError,
  formatManualTrackStartAt,
  parseDurationInput,
  parseStoredDurationToHms,
} from "@/lib/track-duration-input";
import { getEffectiveTrackDistanceMeters } from "@/lib/track-effective-values";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
  // feature-141: the owner-only note. The field is rendered only on owner
  // surfaces; the administrative form never receives or sends it.
  privateNote: z.string().max(2000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  // feature-120: the kind answers "what is this track for" — a routine
  // training session versus a route. It is a private owner-side label and
  // defaults to a route.
  kind: z.enum(["ROUTE", "TRAINING"]),
  // `fileAssetId` is required by the GPX-upload tab and left empty by the
  // route tab (where the geometry lives on the route). The submit button
  // enforces "tab-appropriate" non-empty values per active tab.
  fileAssetId: z.string().optional(),
  fileAssetName: z.string().optional(),
  activityTypeId: z.string().optional(),
  // feature-122: the gear the track was run in. An empty selection is stored
  // as no gear; a form that never touched the field leaves the attachment
  // alone.
  gearId: z.string().optional(),
  // feature-127 route tab fields. The form layer carries them as strings so
  // react-hook-form can manage a single text/datetime input per component;
  // parsing through `parseDurationInput` happens at submit time and
  // `timeSource` is derived live from these values for the badge.
  recordingStartAt: z.string().optional(),
  recordingTimezone: z.string().optional(),
  recordingDurationHours: z.string().optional(),
  recordingDurationMinutes: z.string().optional(),
  recordingDurationSeconds: z.string().optional(),
  includeSeconds: z.boolean().optional(),
});

type TrackFormValues = z.infer<typeof formSchema>;

type TrackCreationMode = "gpx" | "route";

/** `"new"` means "place a route on the map"; every other value is a route id. */
const NEW_ROUTE_VALUE = "new";

const TRACK_FORM_DEFAULTS: TrackFormValues = {
  title: "",
  slug: "",
  description: "",
  privateNote: "",
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

// feature-140: the quick-add buttons are told apart by an icon and a button
// variant, not by the label alone. Walking keeps the primary look the page
// has today — it is the established action — and running is the outline
// button. An unknown activity type falls back to the generic plus sign and
// the outline style, so a new wording entry alone still yields a usable
// button.
const QUICK_ACTIVITY_VISUALS: Record<string, { icon: LucideIcon; variant: "default" | "outline" }> = {
  walking: { icon: Footprints, variant: "default" },
  running: { icon: Zap, variant: "outline" },
};

const DEFAULT_QUICK_ACTIVITY_VISUAL = { icon: Plus, variant: "outline" } as const;

const TrackFormDialog = ({
  track,
  activityTypes,
  routes,
  ownerGear,
  open,
  onOpenChange,
  onParse,
  parsingTrackId,
  onSaved,
  defaultKind = "ROUTE",
  showPrivateNote = false,
}: {
  track: TrackListItem | null;
  activityTypes: TrackActivityType[];
  // feature-127: the owner's route library, read on the page so the dialog
  // can offer "pick an existing route" next to the map editor.
  routes: RouteListItem[];
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
  // feature-141: the private note is an owner-only field. The administrative
  // panel leaves this false so the field never renders or gets written there.
  showPrivateNote?: boolean;
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
  // feature-127: a route-based track owns no file; its geometry comes from
  // the linked route. The edit form must not demand a GPX file for it.
  const isRouteBasedTrack = Boolean(track && !track.fileAssetId && track.route);
  const fileAssetId = useWatch({ control: form.control, name: "fileAssetId" });
  const fileAssetName = useWatch({ control: form.control, name: "fileAssetName" });
  const [activeTab, setActiveTab] = useState<TrackCreationMode>("gpx");
  const [selectedRouteId, setSelectedRouteId] = useState<string>(NEW_ROUTE_VALUE);
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
      setSelectedRouteId(NEW_ROUTE_VALUE);
      setPlacedPoints([]);
    }
  }
  const resetFormState = useCallback(() => {
    setPlacedPoints([]);
    setSelectedRouteId(NEW_ROUTE_VALUE);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const discardGuard = useDiscardGuardedTrackForm({
    savedFileAssetId,
    hasUnsavedChanges: form.formState.isDirty,
    hasUnsavedPoints: placedPoints.length > 0,
    resetFormState,
    onOpenChange,
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
      const startWallClock = track.recordingStartAt
        ? formatManualTrackStartAt({ value: track.recordingStartAt, timezone: track.recordingTimezone })
        : "";
      form.reset({
        title: track.title,
        slug: track.slug,
        description: track.description ?? "",
        privateNote: track.privateNote ?? "",
        status: track.status,
        // feature-120: restore the saved kind, otherwise opening a workout
        // in the edit dialog would show "Route" and saving would demote it.
        kind: track.kind,
        fileAssetId: track.fileAssetId ?? "",
        fileAssetName: track.fileAsset?.name ?? "",
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
  // feature-127: `useWatch` re-renders the time source badge, the duration
  // layout, and the submit availability as the owner fills the recording
  // fields that are now required on the route tab.
  const recordingStartAtValue = useWatch({ control: form.control, name: "recordingStartAt" }) ?? "";
  const recordingDurationHoursValue = useWatch({ control: form.control, name: "recordingDurationHours" }) ?? "0";
  const recordingDurationMinutesValue = useWatch({ control: form.control, name: "recordingDurationMinutes" }) ?? "0";
  const recordingDurationSecondsValue = useWatch({ control: form.control, name: "recordingDurationSeconds" }) ?? "0";
  const includeSecondsValue = Boolean(useWatch({ control: form.control, name: "includeSeconds" }));
  const recordingTimezoneOptions = useMemo(() => getSupportedTrackRecordingTimezones(), []);
  const recordingTimezoneValue = useWatch({ control: form.control, name: "recordingTimezone" }) ?? "";
  const hasStart = recordingStartAtValue.trim().length > 0;
  const hasTimezone = recordingTimezoneValue.trim().length > 0;
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
      // feature-141: only the owner surface carries the note; the admin form
      // omits the key entirely, so its update cannot clear the owner's note.
      ...(showPrivateNote ? { privateNote: values.privateNote?.trim() || null } : {}),
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
        } else if (form.formState.dirtyFields.recordingTimezone) {
          // feature-123: on a GPX row the start and the duration stay read-only
          // — they come from the file — but the timezone is the owner's to
          // correct. The file names an offset, not a zone, and the offset is
          // only a starting point: a recording made in Moscow is stored as
          // `+03:00`, and the owner may want `Europe/Moscow` instead.
          const trimmedTimezone = values.recordingTimezone?.trim() ?? "";
          const timezone = trimmedTimezone ? normalizeTrackRecordingTimezone(trimmedTimezone) : null;

          if (trimmedTimezone && !timezone) {
            toast.error("Choose a supported IANA timezone");
            return;
          }

          await updateTrackRecordingTimezone({ id: track.id, recordingTimezone: timezone });
        }

        toast.success("Track updated");
      } else if (activeTab === "route") {
        const isNewRoute = selectedRouteId === NEW_ROUTE_VALUE;

        if (isNewRoute && placedPoints.length < 2) {
          toast.error(t("trackEditorMinimumPoints"));
          return;
        }
        if (!isNewRoute && !selectedRouteId) {
          toast.error(t("trackFormRouteRequired"));
          return;
        }

        const trimmedStart = values.recordingStartAt?.trim() ?? "";
        const trimmedTimezone = values.recordingTimezone?.trim() ?? "";
        if (!trimmedStart) {
          toast.error(t("trackFormRecordingStartRequired"));
          return;
        }
        if (!trimmedTimezone) {
          toast.error(t("trackFormRecordingTimezoneRequired"));
          return;
        }

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

        if (!hasDuration) {
          toast.error(t("trackFormRecordingDurationRequired"));
          return;
        }

        let parsedDurationSeconds: number;
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

        let routeId = selectedRouteId;
        if (isNewRoute) {
          // feature-127: a new route gets the track's title and description as
          // its first values; the owner can rename it later from /my/routes.
          const routeResult = await createRouteFromPoints({
            title: values.title,
            description: values.description ?? null,
            points: placedPoints,
          });

          if (!routeResult.ok) {
            if (routeResult.code === "TRUST") {
              toast.error(t("placeOnMapErrorTrust"));
            } else if (routeResult.code === "VALIDATION") {
              toast.error(routeResult.message || t("placeOnMapErrorValidation"));
            } else {
              toast.error(t("trackFormRouteCreateError"));
            }
            return;
          }

          routeId = routeResult.routeId;
          // The route now exists even if the track save below fails. Refresh
          // the page so the picker can offer it on a retry.
          onSaved();
        }

        const result = await createTrackFromRoute({
          routeId,
          title: values.title,
          slug: values.slug,
          description: values.description ?? null,
          status: values.status,
          activityTypeId: values.activityTypeId?.trim() || null,
          kind: values.kind,
          gearId: values.gearId || null,
          recordingStartAt: trimmedStart,
          recordingDurationSeconds: parsedDurationSeconds,
          recordingTimezone: trimmedTimezone,
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

        toast.success(t("routeTabSuccess"));
        setPlacedPoints([]);
        setSelectedRouteId(NEW_ROUTE_VALUE);
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
      {/* feature-127: recording fields. On the route tab the start, timezone,
          and duration are required before a track can be saved; on the GPX tab
          the upload supplies the time-related metadata via `parseTrackGpx`.
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
                  placeholder="Area/City"
                  autoComplete="off"
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
        {/* feature-123: the timezone is the one recording field the owner may
            correct on a GPX row — the file names an offset, not a zone. */}
        <p className="text-xs text-muted-foreground">{t("trackRecordingTimezoneEditableHint")}</p>
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
      {showPrivateNote ? (
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
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
    ? isRouteBasedTrack || Boolean(fileAssetId)
    : activeTab === "gpx"
      ? Boolean(fileAssetId)
      : (selectedRouteId !== NEW_ROUTE_VALUE || placedPoints.length >= 2) && hasStart && hasDuration && hasTimezone;

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
                    <TabsTrigger value="route">
                      <MapPin />
                      {t("routeTab")}
                    </TabsTrigger>
                  </TabsList>
                ) : null}
                <TabsContent value="gpx" className="grid gap-4">
                  {renderTextFields()}
                  {isRouteBasedTrack ? (
                    <p className="text-sm text-muted-foreground">{t("trackFormGeometryFromRoute")}</p>
                  ) : (
                    <>
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
                              <Badge variant={getParseStatusVariant(parseState)}>
                                {getParseStatusLabel(parseState)}
                              </Badge>
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
                                      parseState.summary.time.timezoneEvidence === "UTC_OR_OFFSET"
                                        ? "secondary"
                                        : "outline"
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
                    </>
                  )}
                </TabsContent>
                <TabsContent value="route" className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">{t("trackFormRouteSelectLabel")}</div>
                    <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NEW_ROUTE_VALUE}>{t("trackFormRouteNew")}</SelectItem>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {routes.length === 0 ? t("trackFormRouteEmpty") : t("trackFormRouteHelp")}
                    </p>
                  </div>
                  {selectedRouteId === NEW_ROUTE_VALUE ? (
                    <TrackEditor
                      initialPoints={placedPoints}
                      onChangePoints={setPlacedPoints}
                      renderFormFields={renderTextFields}
                      mapAriaLabel={t("trackEditorMapAriaLabel")}
                    />
                  ) : (
                    renderTextFields()
                  )}
                </TabsContent>
              </Tabs>
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting || !canSubmit}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : !isEditing && activeTab === "route"
                      ? t("routeTabCreate")
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
  routes,
  ownerGear,
  ownerGearPreferences,
  defaultKind = "ROUTE",
  tableVariant = "full",
  quickWorkoutUpload = false,
  draftWorkoutUpload = false,
  showPrivateNote = false,
}: {
  tracks: TrackListItem[];
  activityTypes: TrackActivityType[];
  // feature-127: the owner's route library, offered by the creation dialog.
  routes: RouteListItem[];
  // feature-122: the owner's own gear. The gear field is rendered only when
  // this prop is present, so a surface without gear — the administrative
  // panel — cannot show the control at all.
  ownerGear?: GearListItem[];
  // feature-124: the owner's preferred gear per activity type. The surface
  // without preferences — the administrative panel — never receives the map,
  // so nothing about a gear record reaches it.
  ownerGearPreferences?: OwnerGearPreferences;
  // feature-120: the kind a new track starts with on this page. "My
  // workouts" passes "TRAINING"; My tracks and the admin panel keep the
  // default route.
  defaultKind?: TrackKind;
  // feature-120 follow-up: "My workouts" renders the short owner-side
  // table (badges, title, start, distance, type); every other page keeps
  // the full admin column set.
  tableVariant?: "full" | "workouts";
  // feature-123: the one-click quick upload. The button set is rendered only
  // where the owner asked for it — "My workouts" — and only for the activity
  // types that have a wording entry in the interface language.
  quickWorkoutUpload?: boolean;
  // feature-141: the draft capture lives on the same owner page. It is bound
  // to the walking activity type in this slice.
  draftWorkoutUpload?: boolean;
  // feature-141: the owner-only private note is editable only on owner
  // surfaces. The admin panel leaves this false.
  showPrivateNote?: boolean;
}) => {
  const router = useRouter();
  const { i18n } = useT(navigationNamespace);
  const { t } = useT(tripsNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackListItem | null>(null);
  // feature-123: the activity type whose quick-upload button was clicked.
  // `null` means no quick dialog is open.
  const [quickActivityType, setQuickActivityType] = useState<TrackActivityType | null>(null);
  // feature-141: the walking activity type whose draft dialog is open, and the
  // pending row being edited. `editingDraft` null means a new draft.
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<TrackListItem | null>(null);
  const [timezoneTarget, setTimezoneTarget] = useState<TrackListItem | null>(null);
  const [recordingTimezone, setRecordingTimezone] = useState("");
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  const [isSavingTimezone, startSavingTimezone] = useTransition();
  // feature-134: one period value drives All time, the existing ISO week,
  // calendar month/year, and a custom range. The picker year and the custom
  // inputs stay separate so browsing does not filter until a choice is made.
  const currentDate = useMemo(() => new Date(), []);
  const currentWeek = useMemo(() => getIsoWeekForDate(currentDate), [currentDate]);
  const currentMonth = useMemo(() => getCurrentWorkoutMonthPeriod(currentDate), [currentDate]);
  const currentYearPeriod = useMemo(() => getCurrentWorkoutYearPeriod(currentDate), [currentDate]);
  const [period, setPeriod] = useState<WorkoutPeriod>(ALL_WORKOUT_PERIOD);
  const [pickerKind, setPickerKind] = useState<WorkoutPeriod["kind"]>("week");
  const [pickerWeek, setPickerWeek] = useState<IsoWeekRef>(currentWeek);
  const [pickerMonth, setPickerMonth] = useState(currentMonth.month);
  const [pickerYear, setPickerYear] = useState(() => currentWeek.isoYear);
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const selectedWeek = period.kind === "week" ? period.week : null;

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

  // feature-123: an activity type gets a quick-add button when the interface
  // language has a wording entry for it. A type without one gets no button —
  // the fallback would either be a generic label that fits the wrong type, or
  // a wrong noun.
  // feature-140: the walking button keeps the first place in the row; the
  // other types follow it in alphabetical order, so the secondary button does
  // not stand in front of the page's main one.
  const quickActivityTypes = useMemo(() => {
    if (!quickWorkoutUpload) return [];

    return activityTypes
      .filter((activityType) =>
        i18n.exists(`quickWorkout.activities.${activityType.key}.addLabel`, { ns: tripsNamespace }),
      )
      .sort((a, b) => {
        if (a.key === "walking") return -1;
        if (b.key === "walking") return 1;
        return a.nameEn.localeCompare(b.nameEn);
      });
  }, [activityTypes, i18n, quickWorkoutUpload]);

  // feature-141: the draft capture is walking-only in this slice. It needs the
  // active type and the same wording check the quick buttons use.
  const draftActivityType = useMemo(() => {
    if (!draftWorkoutUpload) return null;

    const walking = activityTypes.find((activityType) => activityType.key === "walking" && activityType.isActive);
    if (!walking) return null;
    if (!i18n.exists("quickWorkout.activities.walking.addLabel", { ns: tripsNamespace })) return null;

    return walking;
  }, [activityTypes, draftWorkoutUpload, i18n]);

  // feature-132: ISO week-year options come from the loaded workouts plus the
  // current week-year, so older data stays reachable without hardcoding years.
  const isoYearOptions = useMemo(() => {
    const years = new Set<number>([currentWeek.isoYear, pickerYear]);

    for (const track of tracks) {
      const week = getIsoWeekForTrack(track);
      if (week) years.add(week.isoYear);
    }

    return [...years].sort((first, second) => second - first);
  }, [currentWeek.isoYear, pickerYear, tracks]);

  // feature-134: calendar years come from the recording-timezone dates of the
  // loaded workouts plus the current year, so older data stays reachable.
  const calendarYearOptions = useMemo(() => {
    const years = new Set<number>([currentYearPeriod.year, pickerYear]);

    for (const track of tracks) {
      const date = getTrackCalendarDate(track);
      if (date) years.add(date.getFullYear());
    }

    return [...years].sort((first, second) => second - first);
  }, [currentYearPeriod.year, pickerYear, tracks]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  const pickerWeeks = useMemo(
    () => Array.from({ length: getIsoWeeksInYear(pickerYear) }, (_, index) => index + 1),
    [pickerYear],
  );

  // feature-134: filter before the table through the shared period matcher; a
  // workout without an effective start has no calendar date and is hidden
  // while any period other than All time is selected.
  const visibleTracks = useMemo(() => {
    if (tableVariant !== "workouts" || period.kind === "all") return tracks;

    return tracks.filter((track) => matchesWorkoutPeriod(track, period));
  }, [period, tableVariant, tracks]);

  // feature-135: the summary describes the whole selected week, and a week is
  // rendered in full, so `visibleTracks` is already that complete set. Distance
  // is summed through the same helper the table's Distance column uses.
  // feature-136: the same pass builds the per-day chart series, attributing a
  // workout through the timezone-aware calendar date the week filter uses.
  const weekSummary = useMemo(() => {
    if (tableVariant !== "workouts" || !selectedWeek) return null;

    let distanceMeters = 0;
    let distanceCount = 0;
    let otherActivityCount = 0;

    const categories = {
      walking: { count: 0, distanceMeters: 0, distanceCount: 0 },
      running: { count: 0, distanceMeters: 0, distanceCount: 0 },
    };

    const days: WorkoutWeekDayPoint[] = Array.from({ length: 7 }, () => ({
      walkingCount: 0,
      runningCount: 0,
      walkingDistanceMeters: 0,
      runningDistanceMeters: 0,
    }));

    for (const track of visibleTracks) {
      const rawDistance = getEffectiveTrackDistanceMeters(track);
      const trackDistance = typeof rawDistance === "number" && Number.isFinite(rawDistance) ? rawDistance : null;

      if (trackDistance !== null) {
        distanceMeters += trackDistance;
        distanceCount += 1;
      }

      const activityKey = track.activityType?.key;

      if (activityKey !== "walking" && activityKey !== "running") {
        otherActivityCount += 1;
        continue;
      }

      const calendarDate = getTrackCalendarDate(track);
      if (!calendarDate) continue;

      const day = days[getIsoWeekdayIndex(calendarDate)];
      if (!day) continue;

      if (activityKey === "walking") {
        day.walkingCount += 1;
        if (trackDistance !== null) day.walkingDistanceMeters += trackDistance;
        categories.walking.count += 1;
        if (trackDistance !== null) {
          categories.walking.distanceMeters += trackDistance;
          categories.walking.distanceCount += 1;
        }
      } else {
        day.runningCount += 1;
        if (trackDistance !== null) day.runningDistanceMeters += trackDistance;
        categories.running.count += 1;
        if (trackDistance !== null) {
          categories.running.distanceMeters += trackDistance;
          categories.running.distanceCount += 1;
        }
      }
    }

    const walkingLabel =
      formatActivityTypeName(
        activityTypes.find((activityType) => activityType.key === "walking") ?? null,
        activeLanguage,
      ) || t("workoutWeekChartWalkingFallback");
    const runningLabel =
      formatActivityTypeName(
        activityTypes.find((activityType) => activityType.key === "running") ?? null,
        activeLanguage,
      ) || t("workoutWeekChartRunningFallback");

    return {
      workoutCount: visibleTracks.length,
      distanceMeters: distanceCount > 0 ? distanceMeters : null,
      distanceCount,
      days,
      categories,
      walkingLabel,
      runningLabel,
      otherActivityCount,
    };
  }, [activeLanguage, activityTypes, selectedWeek, t, tableVariant, visibleTracks]);

  const handlePeriodPopoverOpen = (open: boolean) => {
    if (!open) return;

    // Opening from All time primes the Week picker without filtering: the
    // table stays on All time until the owner actually chooses a week.
    setPickerKind(period.kind === "all" ? "week" : period.kind);

    if (period.kind === "week") {
      setPickerWeek(period.week);
      setPickerYear(period.week.isoYear);
    } else if (period.kind === "month") {
      setPickerMonth(period.month);
      setPickerYear(period.year);
    } else if (period.kind === "year") {
      setPickerYear(period.year);
    } else if (period.kind === "custom") {
      setCustomFrom(period.from);
      setCustomTo(period.to);
    } else {
      setPickerWeek(currentWeek);
      setPickerMonth(currentMonth.month);
      setPickerYear(currentWeek.isoYear);
    }
  };

  const handlePickerYearChange = (value: string) => {
    const year = Number(value);
    setPickerYear(year);

    if (pickerKind === "week") {
      if (pickerWeek.isoYear === year && pickerWeek.week > getIsoWeeksInYear(year)) {
        setPickerWeek({ isoYear: year, week: getIsoWeeksInYear(year) });
      }
      return;
    }

    if (pickerKind === "month") {
      setPeriod({ kind: "month", year, month: pickerMonth });
      return;
    }

    if (pickerKind === "year") {
      setPeriod({ kind: "year", year });
    }
  };

  const handleWeekSelect = (value: string) => {
    const week = Number(value);

    setPickerWeek({ isoYear: pickerYear, week });
    setPeriod({ kind: "week", week: { isoYear: pickerYear, week } });
    setPeriodPickerOpen(false);
  };

  const handleMonthSelect = (value: string) => {
    const month = Number(value);

    setPickerMonth(month);
    setPeriod({ kind: "month", year: pickerYear, month });
  };

  const applyCustomRange = () => {
    const from = parseWorkoutDateInput(customFrom);
    const to = parseWorkoutDateInput(customTo);

    if (!from || !to) {
      setCustomError(t("workoutPeriodCustomInvalid"));
      return;
    }

    if (from.getTime() > to.getTime()) {
      setCustomError(t("workoutPeriodCustomReversed"));
      return;
    }

    setCustomError(null);
    setPeriod({ kind: "custom", from: customFrom, to: customTo });
    setPeriodPickerOpen(false);
  };

  const selectCustomDefaults = () => {
    const from = formatWorkoutDateInput(new Date(currentMonth.year, currentMonth.month - 1, 1, 12));
    const to = formatWorkoutDateInput(new Date(currentMonth.year, currentMonth.month, 0, 12));

    setCustomFrom(from);
    setCustomTo(to);
    setCustomError(null);

    return { from, to };
  };

  const handlePeriodKindChange = (kind: WorkoutPeriod["kind"]) => {
    setPickerKind(kind);
    setCustomError(null);

    if (kind === "all") {
      setPeriod(ALL_WORKOUT_PERIOD);
      setPeriodPickerOpen(false);
      return;
    }

    if (kind === "week") {
      setPickerWeek(currentWeek);
      setPickerYear(currentWeek.isoYear);
      setPeriod({ kind: "week", week: currentWeek });
      return;
    }

    if (kind === "month") {
      setPickerMonth(currentMonth.month);
      setPickerYear(currentMonth.year);
      setPeriod(currentMonth);
      return;
    }

    if (kind === "year") {
      setPickerYear(currentYearPeriod.year);
      setPeriod(currentYearPeriod);
      return;
    }

    const { from, to } = selectCustomDefaults();

    setPeriod({ kind: "custom", from, to });
  };

  const periodLabel = useMemo(() => {
    if (period.kind === "all") return t("workoutWeekAll");

    if (period.kind === "week") {
      return t("workoutWeekLabel", {
        week: period.week.week,
        range: formatIsoWeekRange(getIsoWeekRange(period.week.isoYear, period.week.week), activeLanguage),
      });
    }

    if (period.kind === "month") {
      return new Intl.DateTimeFormat(activeLanguage, { month: "long", year: "numeric" }).format(
        new Date(period.year, period.month - 1, 1, 12),
      );
    }

    if (period.kind === "year") return String(period.year);

    return `${period.from} — ${period.to}`;
  }, [activeLanguage, period, t]);

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

    // feature-123: the field starts empty when the row carries no timezone.
    // The browser's zone is a *suggestion*, not a value: prefilling it saved
    // "Europe/Sofia" on a recording made in Moscow, and the owner could not
    // tell that the field held a guess rather than the recording's own zone.
    setRecordingTimezone(timezoneTarget.recordingTimezone ?? "");
  }, [timezoneTarget]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleEditTrack = useCallback(
    (track: TrackListItem) => {
      // feature-141: a pending draft has no geometry, so the full track form
      // would reject it. The small draft dialog owns its fields and completion.
      if (track.geometryState === "PENDING") {
        if (!draftWorkoutUpload) {
          // The admin table must not expose the owner's private note, so the
          // draft editor is only available from My workouts.
          toast.error(t("draftWorkout.ownerOnlyEdit"));

          return;
        }

        setEditingDraft(track);
        setDraftDialogOpen(true);

        return;
      }

      setEditingTrack(track);
      setFormOpen(true);
    },
    [draftWorkoutUpload, t],
  );

  const columns = useMemo(
    () =>
      tableVariant === "workouts"
        ? createTrackWorkoutColumns({
            activeLanguage,
            onEditTrack: handleEditTrack,
            onSetDeleteTarget: deleteConfirm.setTarget,
            formatActivityTypeName,
            incompleteLabel: t("draftWorkout.incomplete"),
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
      {tableVariant === "workouts" ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("workoutPeriodPrevious")}
              disabled={period.kind === "all" || period.kind === "custom"}
              onClick={() => setPeriod((current) => shiftWorkoutPeriod(current, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Popover
              open={periodPickerOpen}
              onOpenChange={(open) => {
                setPeriodPickerOpen(open);
                handlePeriodPopoverOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" className="gap-2 rounded-none border-x px-3">
                  <CalendarDays className="size-4" />
                  {periodLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96">
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <span className="text-sm font-medium">{t("workoutPeriodModeLabel")}</span>
                    <Select
                      value={pickerKind}
                      onValueChange={(value) => handlePeriodKindChange(value as WorkoutPeriod["kind"])}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("workoutWeekAll")}</SelectItem>
                        <SelectItem value="week">{t("workoutPeriodWeek")}</SelectItem>
                        <SelectItem value="month">{t("workoutPeriodMonth")}</SelectItem>
                        <SelectItem value="year">{t("workoutPeriodYear")}</SelectItem>
                        <SelectItem value="custom">{t("workoutPeriodCustom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {pickerKind === "week" ? (
                    <>
                      <div className="grid gap-1">
                        <span className="text-sm font-medium">{t("workoutWeekYearLabel")}</span>
                        <Select value={String(pickerYear)} onValueChange={handlePickerYearChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isoYearOptions.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-sm font-medium">{t("workoutWeekSelectLabel")}</span>
                        <Select
                          value={pickerWeek.isoYear === pickerYear ? String(pickerWeek.week) : undefined}
                          onValueChange={handleWeekSelect}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("workoutWeekSelectLabel")} />
                          </SelectTrigger>
                          <SelectContent>
                            {pickerWeeks.map((week) => (
                              <SelectItem key={week} value={String(week)}>
                                {t("workoutWeekLabel", {
                                  week,
                                  range: formatIsoWeekRange(getIsoWeekRange(pickerYear, week), activeLanguage),
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPeriod(ALL_WORKOUT_PERIOD);
                            setPeriodPickerOpen(false);
                          }}
                        >
                          {t("workoutWeekAll")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setPickerYear(currentWeek.isoYear);
                            setPeriod({ kind: "week", week: currentWeek });
                            setPeriodPickerOpen(false);
                          }}
                        >
                          {t("workoutWeekThisWeek")}
                        </Button>
                      </div>
                    </>
                  ) : null}
                  {pickerKind === "month" ? (
                    <>
                      <div className="grid gap-1">
                        <span className="text-sm font-medium">{t("workoutPeriodYearLabel")}</span>
                        <Select value={String(pickerYear)} onValueChange={handlePickerYearChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {calendarYearOptions.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-sm font-medium">{t("workoutPeriodMonthLabel")}</span>
                        <Select value={String(pickerMonth)} onValueChange={handleMonthSelect}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((month) => (
                              <SelectItem key={month} value={String(month)}>
                                {new Intl.DateTimeFormat(activeLanguage, { month: "long" }).format(
                                  new Date(pickerYear, month - 1, 1, 12),
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setPeriod(currentMonth);
                            setPickerYear(currentMonth.year);
                          }}
                        >
                          {t("workoutPeriodThisMonth")}
                        </Button>
                      </div>
                    </>
                  ) : null}
                  {pickerKind === "year" ? (
                    <>
                      <div className="grid gap-1">
                        <span className="text-sm font-medium">{t("workoutPeriodYearLabel")}</span>
                        <Select value={String(pickerYear)} onValueChange={handlePickerYearChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {calendarYearOptions.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setPeriod(currentYearPeriod);
                            setPickerYear(currentYearPeriod.year);
                          }}
                        >
                          {t("workoutPeriodThisYear")}
                        </Button>
                      </div>
                    </>
                  ) : null}
                  {pickerKind === "custom" ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="grid gap-1 text-sm">
                          <span className="text-muted-foreground">{t("workoutPeriodCustomFrom")}</span>
                          <Input
                            type="date"
                            value={customFrom}
                            onChange={(event) => setCustomFrom(event.target.value)}
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span className="text-muted-foreground">{t("workoutPeriodCustomTo")}</span>
                          <Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
                        </label>
                      </div>
                      {customError ? <p className="text-sm text-destructive">{customError}</p> : null}
                      <div className="flex justify-end">
                        <Button type="button" size="sm" onClick={applyCustomRange}>
                          {t("workoutPeriodCustomApply")}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("workoutPeriodNext")}
              disabled={period.kind === "all" || period.kind === "custom"}
              onClick={() => setPeriod((current) => shiftWorkoutPeriod(current, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {selectedWeek && weekSummary ? (
            <WorkoutWeekSummary
              selectedWeek={selectedWeek}
              activeLanguage={activeLanguage}
              workoutCount={weekSummary.workoutCount}
              distanceMeters={weekSummary.distanceMeters}
              distanceCount={weekSummary.distanceCount}
              days={weekSummary.days}
              categories={weekSummary.categories}
              walkingLabel={weekSummary.walkingLabel}
              runningLabel={weekSummary.runningLabel}
              otherActivityCount={weekSummary.otherActivityCount}
            />
          ) : null}
          {period.kind !== "all" ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setPeriod(ALL_WORKOUT_PERIOD)}>
              {t("workoutWeekAll")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <DataTable
        data={visibleTracks}
        columns={columns}
        // feature-134: a selected week still renders in full; All time, a
        // month, a year, and a custom range paginate at the existing size.
        pagination={tableVariant !== "workouts" || isWorkoutPeriodPaginated(period) ? { pageSize: 10 } : undefined}
        pageResetKey={getWorkoutPeriodKey(period)}
        defaultSortHint={
          tableVariant === "workouts" ? t("tableDefaultSortHintStarted") : t("tableDefaultSortHintUpdated")
        }
        formatSortStatus={(label, descending) =>
          t(descending ? "tableSortStatusDescending" : "tableSortStatusAscending", { column: label })
        }
        initialSorting={
          tableVariant === "workouts" ? [{ id: "started", desc: true }] : [{ id: "updatedAt", desc: true }]
        }
        headerActions={
          <>
            {quickActivityTypes.map((activityType) => {
              const { icon: QuickIcon, variant } =
                QUICK_ACTIVITY_VISUALS[activityType.key] ?? DEFAULT_QUICK_ACTIVITY_VISUAL;

              return (
                <Button
                  key={activityType.id}
                  type="button"
                  variant={variant}
                  onClick={() => setQuickActivityType(activityType)}
                >
                  <QuickIcon />
                  {t(`quickWorkout.activities.${activityType.key}.addLabel`)}
                </Button>
              );
            })}
            {draftActivityType ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingDraft(null);
                  setDraftDialogOpen(true);
                }}
              >
                <NotebookPen />
                {t("draftWorkout.addLabel")}
              </Button>
            ) : null}
            <Button type="button" onClick={handleCreateClick}>
              <Plus />
              Add track
            </Button>
          </>
        }
      />
      {quickActivityType ? (
        <QuickWorkoutUploadDialog
          // The dialog is keyed by the activity type: another type gets its
          // own form, with its own preferred gear as the default.
          key={quickActivityType.id}
          activityType={{ id: quickActivityType.id, key: quickActivityType.key }}
          ownerGear={ownerGear ?? []}
          preferredGearId={ownerGearPreferences?.[quickActivityType.id]?.gearId ?? null}
          // feature-146: the route mode of the quick dialog offers the
          // owner's own routes.
          routes={routes}
          open
          onOpenChange={(open) => {
            if (!open) setQuickActivityType(null);
          }}
          onSaved={() => router.refresh()}
        />
      ) : null}
      {draftActivityType && draftDialogOpen ? (
        <DraftWorkoutDialog
          key={editingDraft?.id ?? "new-draft"}
          open
          onOpenChange={(open) => {
            setDraftDialogOpen(open);
            if (!open) setEditingDraft(null);
          }}
          activityType={{ id: draftActivityType.id, key: draftActivityType.key }}
          ownerGear={ownerGear ?? []}
          preferredGearId={ownerGearPreferences?.[draftActivityType.id]?.gearId ?? null}
          routes={routes}
          draft={editingDraft}
          onSaved={() => router.refresh()}
        />
      ) : null}
      <TrackFormDialog
        track={editingTrack}
        activityTypes={activityTypes}
        routes={routes}
        ownerGear={ownerGear}
        open={formOpen}
        defaultKind={defaultKind}
        onParse={rowActions.handleParse}
        parsingTrackId={rowActions.parsingTrackId}
        onSaved={() => router.refresh()}
        showPrivateNote={showPrivateNote}
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
                placeholder="Area/City"
                autoComplete="off"
              />
              <datalist id="track-recording-timezone-options">
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone} />
                ))}
              </datalist>
              {browserTimezone ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto justify-start p-0 text-xs"
                  onClick={() => setRecordingTimezone(browserTimezone)}
                >
                  {`Use the browser timezone: ${browserTimezone}`}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Choose a supported IANA timezone.</p>
              )}
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

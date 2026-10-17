"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clock3, Edit, FileUp, MapPin, Plus, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { navigationNamespace, tripsNamespace } from "@/app/i18n/settings";
import {
  createManualTrack,
  createTrack,
  deleteTrack,
  parseTrackGpx,
  updateTrack,
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
import type { TrackStatus } from "@/generated/prisma/enums";
import type { TrackActivityType } from "@/generated/prisma/client";
import { formatFileSize } from "@/lib/file-upload-limits";
import { formatHikeDateRange, formatHikeStatus, formatHikeType } from "@/lib/hikes";
import { createSlug } from "@/lib/slug-generator";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { TrackEditor, type ManualTrackPoint } from "@/components/track-pages/track-editor";
import {
  formatTrackRecordingTimezone,
  getSupportedTrackRecordingTimezones,
  normalizeTrackRecordingTimezone,
} from "@/lib/track-recording-timezone";
import { formatTrackStatus, trackStatusOptions } from "@/lib/tracks";
import {
  formatTrackDistance,
  formatTrackDuration,
  formatTrackPointCount,
  formatTrackRecordingDateTime,
  formatTrackRecordingTimeRange,
  formatTrackTimeSource,
  formatTrackTimezoneEvidence,
  formatTrackTimelinePresence,
  getTrackGpxMetadataState,
  type TrackGpxMetadataState,
} from "@/lib/track-gpx-metadata";
import { TrackDurationInputError, parseDurationInput } from "@/lib/track-duration-input";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  // `fileAssetId` is required by the GPX-upload tab and left empty by the
  // Place on map tab (where the file asset is built server-side from the
  // placed points). The submit button enforces "tab-appropriate" non-empty
  // values per active tab.
  fileAssetId: z.string().optional(),
  fileAssetName: z.string().optional(),
  activityTypeId: z.string().optional(),
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

const defaultValues: TrackFormValues = {
  title: "",
  slug: "",
  description: "",
  status: "DRAFT",
  fileAssetId: "",
  fileAssetName: "",
  activityTypeId: "",
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

const getTrackParseState = (track: TrackListItem): TrackGpxMetadataState =>
  getTrackGpxMetadataState(track.metadata, {
    fileAssetId: track.fileAsset.id,
    fileKey: track.fileAsset.fileKey,
  });

const getParseStatusLabel = (state: TrackGpxMetadataState) => {
  if (state.status === "SUCCESS") return "Parsed";
  if (state.status === "FAILED") return "Failed";
  if (state.status === "STALE") return "Needs reparse";

  return "Not parsed";
};

const getParseStatusVariant = (state: TrackGpxMetadataState) => {
  if (state.status === "SUCCESS") return "default";
  if (state.status === "FAILED") return "destructive";

  return "outline";
};

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));
const formatActivityTypeName = (activityType: TrackActivityType, language?: string) =>
  language === "ru" ? activityType.nameRu || activityType.nameEn : activityType.nameEn;

const TrackParseStatus = ({ track }: { track: TrackListItem }) => {
  const state = getTrackParseState(track);
  const distance = state.status === "SUCCESS" ? formatTrackDistance(state.summary.distanceMeters) : null;
  const points = state.status === "SUCCESS" ? formatTrackPointCount(state.summary.points) : null;
  const timeline = state.status === "SUCCESS" ? formatTrackTimelinePresence(state.timeline) : null;
  const recordingTime =
    state.status === "SUCCESS" ? formatTrackRecordingTimeRange(state.summary.time, track.recordingTimezone) : null;
  const manualStart =
    track.timeSource === "MANUAL" && track.recordingStartAt
      ? formatTrackRecordingDateTime(track.recordingStartAt.toISOString(), track.recordingTimezone)
      : null;
  const manualDuration =
    track.timeSource === "MANUAL" && track.recordingDurationSeconds !== null
      ? formatTrackDuration(track.recordingDurationSeconds)
      : null;

  return (
    <div className="flex max-w-72 flex-wrap items-center gap-1.5">
      <div className="flex basis-full flex-wrap items-center gap-1.5">
        <Badge variant={getParseStatusVariant(state)}>{getParseStatusLabel(state)}</Badge>
        {track.timeSource ? <Badge variant="secondary">Source: {formatTrackTimeSource(track.timeSource)}</Badge> : null}
        {state.status === "SUCCESS" && state.summary.time ? (
          <Badge variant={state.summary.time.timezoneEvidence === "UTC_OR_OFFSET" ? "secondary" : "outline"}>
            {formatTrackTimezoneEvidence(state.summary.time.timezoneEvidence)}
          </Badge>
        ) : null}
        {state.status === "SUCCESS" ? (
          <Badge variant={state.timeline && state.timeline.length > 0 ? "secondary" : "outline"}>{timeline}</Badge>
        ) : null}
      </div>
      {state.status === "SUCCESS" ? (
        <>
          {[distance, points].filter(Boolean).map((value) => (
            <span key={value} className="text-xs text-muted-foreground">
              {value}
            </span>
          ))}
          {recordingTime ? <span className="text-xs text-muted-foreground">Recording {recordingTime}</span> : null}
        </>
      ) : null}
      {track.timeSource === "MANUAL" && (manualStart || manualDuration) ? (
        <div className="flex basis-full flex-col gap-0.5 text-xs text-muted-foreground">
          {manualStart ? <span>Recording start: {manualStart}</span> : null}
          {manualDuration ? <span>Recording duration: {manualDuration}</span> : null}
        </div>
      ) : null}
      {state.status === "FAILED" || state.status === "STALE" ? (
        <div className="line-clamp-2 text-xs text-muted-foreground">{state.errorMessage}</div>
      ) : null}
    </div>
  );
};

const TrackFormDialog = ({
  track,
  activityTypes,
  open,
  onOpenChange,
  onParse,
  parsingTrackId,
  onSaved,
}: {
  track: TrackListItem | null;
  activityTypes: TrackActivityType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParse: (track: TrackListItem) => void;
  parsingTrackId: string | null;
  onSaved: () => void;
}) => {
  const { i18n, t } = useT(tripsNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const form = useForm<TrackFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });
  const isEditing = Boolean(track);
  const parseState = track ? getTrackParseState(track) : null;
  const isParsing = Boolean(track && parsingTrackId === track.id);
  const savedFileAssetId = track?.fileAssetId ?? null;
  const fileAssetId = useWatch({ control: form.control, name: "fileAssetId" });
  const fileAssetName = useWatch({ control: form.control, name: "fileAssetName" });
  const [uploadedFileAssetIds, setUploadedFileAssetIds] = useState<string[]>([]);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [isDiscarding, startDiscarding] = useTransition();
  const [activeTab, setActiveTab] = useState<TrackCreationMode>("gpx");
  const [placedPoints, setPlacedPoints] = useState<ManualTrackPoint[]>([]);
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
  const discardFileAssetIds = useMemo(
    () => uploadedFileAssetIds.filter((uploadedFileAssetId) => uploadedFileAssetId !== savedFileAssetId),
    [savedFileAssetId, uploadedFileAssetIds],
  );
  const hasUnsavedUploads = discardFileAssetIds.length > 0;
  const hasUnsavedPoints = placedPoints.length > 0;
  const hasGuardedChanges = form.formState.isDirty || hasUnsavedUploads || hasUnsavedPoints;

  useEffect(() => {
    if (!open) return;

    if (track) {
      form.reset({
        title: track.title,
        slug: track.slug,
        description: track.description ?? "",
        status: track.status,
        fileAssetId: track.fileAssetId,
        fileAssetName: track.fileAsset.name,
        activityTypeId: track.activityTypeId ?? "",
        // The existing edit dialog stays display-only for the four new
        // feature-112 metadata fields per design decision 7 — the values
        // reset to defaults so the slot renders the same starting shape as
        // a fresh create.
        recordingStartAt: "",
        recordingTimezone: track.recordingTimezone ?? "",
        recordingDurationHours: "0",
        recordingDurationMinutes: "0",
        recordingDurationSeconds: "0",
        includeSeconds: false,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [form, track, open]);

  const titleValue = useWatch({ control: form.control, name: "title" });
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

  const closeWithoutGuard = () => {
    setDiscardConfirmOpen(false);
    setUploadedFileAssetIds([]);
    setPlacedPoints([]);
    form.reset(defaultValues);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (hasGuardedChanges) {
      setDiscardConfirmOpen(true);
      return;
    }

    closeWithoutGuard();
  };

  const handleConfirmDiscard = () => {
    const fileIdsToDiscard = discardFileAssetIds;

    if (fileIdsToDiscard.length === 0) {
      closeWithoutGuard();
      return;
    }

    startDiscarding(async () => {
      const result = await markDiscardedTrackGpxFileAssetsPendingDelete(fileIdsToDiscard);

      if (!result.success) {
        toast.error(result.message || "Uploaded GPX file could not be removed");
        return;
      }

      toast.success("Uploaded GPX file discarded");
      closeWithoutGuard();
    });
  };

  const cleanupSupersededUploads = async (savedFileId: string) => {
    const supersededFileIds = discardFileAssetIds.filter((uploadedFileAssetId) => uploadedFileAssetId !== savedFileId);

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
    };

    try {
      if (track) {
        await updateTrack({
          id: track.id,
          ...trackPayload,
        });
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
        closeWithoutGuard();
        onSaved();
        return;
      } else {
        await createTrack(trackPayload);
        toast.success("Track created");
      }

      await cleanupSupersededUploads(values.fileAssetId ?? "");
      closeWithoutGuard();
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
      </div>
      {/* feature-112 Place on map tab fields. Rendered for both tabs per
          design decision 4 (the slot is shared) — the values are optional and
          only consumed by `createManualTrack`; on the GPX tab the upload
          itself supplies any time-related metadata via `parseTrackGpx`. */}
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="recordingStartAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("placeOnMapRecordingStartLabel")}</FormLabel>
              <FormControl>
                <Input {...field} type="datetime-local" placeholder="2026-10-12T09:30" autoComplete="off" />
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
                  <Input {...field} type="number" inputMode="numeric" min={0} max={24} step={1} />
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
                  <Input {...field} type="number" inputMode="numeric" min={0} max={59} step={1} />
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
                    <Input {...field} type="number" inputMode="numeric" min={0} max={59} step={1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                      setUploadedFileAssetIds((current) => uniqueIds([...current, fileAssetId]));
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
      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title={
          hasUnsavedUploads
            ? "Discard track and uploaded GPX?"
            : hasUnsavedPoints
              ? "Discard placed points?"
              : "Discard track changes?"
        }
        description={
          hasUnsavedUploads
            ? "This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing."
            : hasUnsavedPoints
              ? "This form has unsaved changes and placed map points. Discarding will close the modal without saving them."
              : "This form has unsaved changes. Discarding will close the modal without saving them."
        }
        confirmLabel={hasUnsavedUploads ? "Discard and remove file" : "Discard changes"}
        confirmVariant="destructive"
        isPending={isDiscarding}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
};

export const TrackManagementPanel = ({
  tracks,
  activityTypes,
}: {
  tracks: TrackListItem[];
  activityTypes: TrackActivityType[];
}) => {
  const router = useRouter();
  const { i18n } = useT(navigationNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrackListItem | null>(null);
  const [timezoneTarget, setTimezoneTarget] = useState<TrackListItem | null>(null);
  const [recordingTimezone, setRecordingTimezone] = useState("");
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  const [parsingTrackId, setParsingTrackId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();
  const [isSavingTimezone, startSavingTimezone] = useTransition();
  const [, startParsing] = useTransition();

  const timezoneOptions = useMemo(() => getSupportedTrackRecordingTimezones(), []);

  useEffect(() => {
    const detected = normalizeTrackRecordingTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    setBrowserTimezone(detected);
  }, []);

  useEffect(() => {
    if (!timezoneTarget) return;

    setRecordingTimezone(timezoneTarget.recordingTimezone ?? browserTimezone ?? "UTC");
  }, [browserTimezone, timezoneTarget]);

  const handleParse = useCallback(
    (track: TrackListItem) => {
      setParsingTrackId(track.id);

      startParsing(async () => {
        try {
          const metadata = await parseTrackGpx(track.id);

          if (metadata.gpxParse.status === "SUCCESS") {
            toast.success("GPX parsed");
          } else {
            toast.error(metadata.gpxParse.errorMessage ?? "GPX parsing failed");
          }

          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to parse GPX");
        } finally {
          setParsingTrackId(null);
        }
      });
    },
    [router],
  );

  const columns = useMemo<ColumnDef<TrackListItem>[]>(
    () => [
      {
        id: "activityType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.activityType
              ? formatActivityTypeName(row.original.activityType, activeLanguage)
              : "Unclassified"}
          </Badge>
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Title
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.status === "PUBLISHED" ? (
            <Link
              href={`/tracks/${row.original.slug}`}
              className="font-medium text-foreground hover:underline focus-visible:underline"
            >
              {row.original.title}
            </Link>
          ) : (
            <div className="font-medium">{row.original.title}</div>
          ),
      },
      {
        accessorKey: "fileAsset.name",
        header: "GPX file",
        cell: ({ row }) => (
          <div className="grid max-w-64 gap-1">
            <div className="truncate" title={row.original.fileAsset.name}>
              {row.original.fileAsset.name}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={row.original.status === "PUBLISHED" ? "default" : "secondary"}>
                {formatTrackStatus(row.original.status)}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatFileSize(row.original.fileAsset.sizeBytes)}</span>
            </div>
          </div>
        ),
      },
      {
        id: "parse",
        header: "GPX summary",
        cell: ({ row }) => <TrackParseStatus track={row.original} />,
      },
      {
        id: "timezone",
        header: "Timezone",
        cell: ({ row }) => (
          <Badge variant={row.original.recordingTimezone ? "secondary" : "outline"}>
            {formatTrackRecordingTimezone(row.original.recordingTimezone)}
          </Badge>
        ),
      },
      {
        id: "hikes",
        header: "Trips",
        cell: ({ row }) => (
          <div className="flex max-w-56 flex-col gap-1">
            {row.original.hikes.length > 0 ? (
              row.original.hikes.slice(0, 2).map(({ hike }) => (
                <div key={hike.id} className="grid gap-1">
                  <div className="truncate text-sm font-medium" title={hike.title}>
                    {hike.title}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={hike.status === "PUBLISHED" ? "default" : "secondary"}>
                      {formatHikeStatus(hike.status)}
                    </Badge>
                    <Badge variant="outline">{formatHikeType(hike.type)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatHikeDateRange(hike)}</div>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">None</span>
            )}
            {row.original.hikes.length > 2 ? <Badge variant="outline">+{row.original.hikes.length - 2}</Badge> : null}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Set recording timezone"
              onClick={() => setTimezoneTarget(row.original)}
            >
              <Clock3 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Parse GPX"
              disabled={parsingTrackId === row.original.id}
              onClick={() => handleParse(row.original)}
            >
              <RefreshCw className={`size-4 ${parsingTrackId === row.original.id ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Edit track"
              onClick={() => {
                setEditingTrack(row.original);
                setFormOpen(true);
              }}
            >
              <Edit className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Delete track"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [activeLanguage, handleParse, parsingTrackId],
  );

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

  const handleDelete = () => {
    if (!deleteTarget) return;

    startDeleting(async () => {
      const result = await deleteTrack(deleteTarget.id);

      if (result.success) {
        toast.success("Track deleted");
      } else {
        toast.error("Track not found");
      }

      setDeleteTarget(null);
      router.refresh();
    });
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
        open={formOpen}
        onParse={handleParse}
        parsingTrackId={parsingTrackId}
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete track?"
        description={deleteTarget ? `This will remove "${deleteTarget.title}" from the admin tracks list.` : undefined}
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// Kept as a compatibility export for the existing administrator workspace route.
export const TracksAdminPanel = TrackManagementPanel;

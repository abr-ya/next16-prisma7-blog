"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, FileUp, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { createTrack, deleteTrack, parseTrackGpx, updateTrack, type TrackListItem } from "@/app/_data/tracks";
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
} from "@/components/index";
import type { TrackStatus } from "@/generated/prisma/enums";
import { formatFileSize, TRACK_GPX_UPLOAD_MAX_SIZE } from "@/lib/file-upload-limits";
import { formatHikeDateRange, formatHikeStatus, formatHikeType } from "@/lib/hikes";
import { UploadDropzone } from "@/lib/uploadthing";
import { createSlug } from "@/lib/slug-generator";
import { formatTrackStatus, trackStatusOptions } from "@/lib/tracks";
import {
  formatTrackDistance,
  formatTrackPointCount,
  formatTrackRecordingTimeRange,
  formatTrackTimezoneEvidence,
  formatTrackTimelinePresence,
  getTrackGpxMetadataState,
  type TrackGpxMetadataState,
} from "@/lib/track-gpx-metadata";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  fileAssetId: z.string().min(1, { message: "GPX file is required" }),
  fileAssetName: z.string().optional(),
});

type TrackFormValues = z.infer<typeof formSchema>;

const defaultValues: TrackFormValues = {
  title: "",
  slug: "",
  description: "",
  status: "DRAFT",
  fileAssetId: "",
  fileAssetName: "",
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

const TrackParseStatus = ({ track }: { track: TrackListItem }) => {
  const state = getTrackParseState(track);
  const distance = state.status === "SUCCESS" ? formatTrackDistance(state.summary.distanceMeters) : null;
  const points = state.status === "SUCCESS" ? formatTrackPointCount(state.summary.points) : null;
  const timeline = state.status === "SUCCESS" ? formatTrackTimelinePresence(state.timeline) : null;
  const recordingTime = state.status === "SUCCESS" ? formatTrackRecordingTimeRange(state.summary.time) : null;

  return (
    <div className="flex max-w-72 flex-wrap items-center gap-1.5">
      <div className="flex basis-full flex-wrap items-center gap-1.5">
        <Badge variant={getParseStatusVariant(state)}>{getParseStatusLabel(state)}</Badge>
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
      {state.status === "FAILED" || state.status === "STALE" ? (
        <div className="line-clamp-2 text-xs text-muted-foreground">{state.errorMessage}</div>
      ) : null}
    </div>
  );
};

const TrackFormDialog = ({
  track,
  open,
  onOpenChange,
  onParse,
  parsingTrackId,
  onSaved,
}: {
  track: TrackListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParse: (track: TrackListItem) => void;
  parsingTrackId: string | null;
  onSaved: () => void;
}) => {
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
  const discardFileAssetIds = useMemo(
    () => uploadedFileAssetIds.filter((uploadedFileAssetId) => uploadedFileAssetId !== savedFileAssetId),
    [savedFileAssetId, uploadedFileAssetIds],
  );
  const hasUnsavedUploads = discardFileAssetIds.length > 0;
  const hasGuardedChanges = form.formState.isDirty || hasUnsavedUploads;

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
      });
    } else {
      form.reset(defaultValues);
    }
  }, [form, track, open]);

  const titleValue = useWatch({ control: form.control, name: "title" });

  const handleGenerateSlug = () => {
    const slug = createSlug(titleValue);

    if (slug) {
      form.setValue("slug", slug, { shouldDirty: true, shouldValidate: true });
    }
  };

  const closeWithoutGuard = () => {
    setDiscardConfirmOpen(false);
    setUploadedFileAssetIds([]);
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
    };

    try {
      if (track) {
        await updateTrack({
          id: track.id,
          ...trackPayload,
        });
        toast.success("Track updated");
      } else {
        await createTrack(trackPayload);
        toast.success("Track created");
      }

      await cleanupSupersededUploads(values.fileAssetId);
      closeWithoutGuard();
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save track");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit track" : "Create track"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
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
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
              <UploadDropzone
                endpoint="trackGpxUploader"
                content={{
                  label: isEditing ? "Drop or click to replace the GPX file" : "Drop or click to upload a GPX file",
                  allowedContent: `One .gpx file up to ${TRACK_GPX_UPLOAD_MAX_SIZE}.`,
                }}
                appearance={{
                  button: "rounded-lg",
                  container: "rounded-lg border",
                }}
                onUploadError={(error) => {
                  toast.error(error.message || "Uploading GPX failed");
                }}
                onClientUploadComplete={(files) => {
                  const uploaded = files.at(0);
                  const fileAssetId = uploaded?.serverData?.fileAssetId;

                  if (!fileAssetId) {
                    toast.error("Uploaded GPX was not recorded");
                    return;
                  }

                  form.setValue("fileAssetId", fileAssetId, { shouldDirty: true, shouldValidate: true });
                  form.setValue("fileAssetName", uploaded.name, { shouldDirty: true, shouldValidate: true });
                  setUploadedFileAssetIds((current) => uniqueIds([...current, fileAssetId]));
                  toast.success("GPX uploaded");
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
                          <span>{formatTrackRecordingTimeRange(parseState.summary.time)}</span>
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
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting || !fileAssetId}>
                  {form.formState.isSubmitting ? "Saving..." : "Save track"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title={hasUnsavedUploads ? "Discard track and uploaded GPX?" : "Discard track changes?"}
        description={
          hasUnsavedUploads
            ? "This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing."
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

export const TracksAdminPanel = ({ tracks }: { tracks: TrackListItem[] }) => {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrackListItem | null>(null);
  const [parsingTrackId, setParsingTrackId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();
  const [, startParsing] = useTransition();

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
        accessorKey: "title",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Title
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
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
        id: "hikes",
        header: "Hikes",
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
    [handleParse, parsingTrackId],
  );

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
        open={formOpen}
        onParse={handleParse}
        parsingTrackId={parsingTrackId}
        onSaved={() => router.refresh()}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTrack(null);
        }}
      />
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

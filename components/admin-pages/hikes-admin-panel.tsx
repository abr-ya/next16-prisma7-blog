"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock3,
  Edit,
  ImageIcon,
  Link2,
  Plus,
  Route,
  Trash2,
  Unlink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import {
  acceptHikePhotoTrackTimeMatchCandidate,
  attachTrackToHike,
  attachPhotoToHike,
  createHike,
  deleteHike,
  detachPhotoFromHike,
  detachTrackFromHike,
  reorderHikePhotos,
  updateHike,
  type HikeListItem,
  type HikePhotoOption,
  type HikeTrackOption,
} from "@/app/_data/hikes";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { HikeStatus, HikeType } from "@/generated/prisma/enums";
import { formatHikeStatus, formatHikeType, hikeStatusOptions, hikeTypeOptions } from "@/lib/hikes";
import {
  proposeTrackTimeMatchCandidates,
  type TrackTimeMatchCandidate,
  type TrackTimeMatchTrackInput,
} from "@/lib/outdoor-photo-track-time-matching";
import { formatPhotoStatus } from "@/lib/photos";
import { createSlug } from "@/lib/slug-generator";
import { formatTrackStatus } from "@/lib/tracks";

const formSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    slug: z.string().min(1, { message: "Slug is required" }),
    description: z.string().optional(),
    startDate: z.string().min(1, { message: "Start date is required" }),
    endDate: z.string().min(1, { message: "End date is required" }),
    type: z.enum(["HIKING", "MOUNTAIN", "WATER", "SKI", "BIKE", "OTHER"]),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .refine((values) => new Date(values.endDate) >= new Date(values.startDate), {
    message: "End date must be the same as or later than start date",
    path: ["endDate"],
  });

type HikeFormValues = z.infer<typeof formSchema>;

const defaultValues: HikeFormValues = {
  title: "",
  slug: "",
  description: "",
  startDate: "",
  endDate: "",
  type: "HIKING",
  status: "DRAFT",
};

const dateInputValue = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const getDateRange = (hike: HikeListItem) => `${formatDate(hike.startDate)} - ${formatDate(hike.endDate)}`;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const isCoordinate = (value: unknown): value is { lat: number; lng: number } =>
  typeof value === "object" &&
  value !== null &&
  "lat" in value &&
  "lng" in value &&
  typeof value.lat === "number" &&
  typeof value.lng === "number";

const toTrackTimeMatchTracks = (hike: HikeListItem | null): TrackTimeMatchTrackInput[] =>
  hike?.tracks
    .filter(({ track }) => track.status === "PUBLISHED")
    .map(({ track }) => {
      const metadata = track.metadata as {
        summary?: {
          time?: {
            start?: unknown;
            end?: unknown;
          } | null;
        } | null;
        mapGeometry?: unknown;
      } | null;
      const time = metadata?.summary?.time;
      const geometry = Array.isArray(metadata?.mapGeometry) ? metadata.mapGeometry : [];
      const firstPoint = geometry.at(0);
      const lastPoint = geometry.at(-1);

      return {
        id: track.id,
        title: track.title,
        slug: track.slug,
        recordingTime:
          typeof time?.start === "string" && typeof time?.end === "string"
            ? {
                start: time.start,
                end: time.end,
              }
            : null,
        startPoint: isCoordinate(firstPoint) ? firstPoint : null,
        endPoint: isCoordinate(lastPoint) ? lastPoint : null,
      };
    }) ?? [];

const HikeFormDialog = ({
  hike,
  open,
  onOpenChange,
}: {
  hike: HikeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const form = useForm<HikeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });
  const isEditing = Boolean(hike);

  useEffect(() => {
    if (!open) return;

    if (hike) {
      form.reset({
        title: hike.title,
        slug: hike.slug,
        description: hike.description ?? "",
        startDate: dateInputValue(hike.startDate),
        endDate: dateInputValue(hike.endDate),
        type: hike.type,
        status: hike.status,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [form, hike, open]);

  const titleValue = useWatch({ control: form.control, name: "title" });

  const handleGenerateSlug = () => {
    const slug = createSlug(titleValue);

    if (slug) {
      form.setValue("slug", slug, { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = async (values: HikeFormValues) => {
    try {
      if (hike) {
        await updateHike({
          id: hike.id,
          ...values,
          type: values.type as HikeType,
          status: values.status as HikeStatus,
        });
        toast.success("Hike updated");
      } else {
        await createHike({ ...values, type: values.type as HikeType, status: values.status as HikeStatus });
        toast.success("Hike created");
      }

      onOpenChange(false);
      form.reset(defaultValues);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save hike");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit hike" : "Create hike"}</DialogTitle>
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hikeTypeOptions.map((option) => (
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
                        {hikeStatusOptions.map((option) => (
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
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save hike"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const HikeTracksDialog = ({
  hike,
  tracks,
  open,
  onOpenChange,
  onChanged,
}: {
  hike: HikeListItem | null;
  tracks: HikeTrackOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) => {
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [attachedTrackIds, setAttachedTrackIds] = useState<string[]>([]);
  const [, startChanging] = useTransition();
  const associatedTrackIds = useMemo(() => new Set(attachedTrackIds), [attachedTrackIds]);
  const attachedTracks = tracks.filter((track) => associatedTrackIds.has(track.id));
  const availableTracks = tracks.filter((track) => !associatedTrackIds.has(track.id));

  useEffect(() => {
    if (!open) return;

    setAttachedTrackIds(hike?.tracks.map(({ track }) => track.id) ?? []);
  }, [hike, open]);

  const handleAttach = (trackId: string) => {
    if (!hike) return;

    setPendingTrackId(trackId);
    startChanging(async () => {
      try {
        await attachTrackToHike({ hikeId: hike.id, trackId });
        setAttachedTrackIds((current) => (current.includes(trackId) ? current : [trackId, ...current]));
        toast.success("Track attached");
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to attach track");
      } finally {
        setPendingTrackId(null);
      }
    });
  };

  const handleDetach = (trackId: string) => {
    if (!hike) return;

    setPendingTrackId(trackId);
    startChanging(async () => {
      try {
        const result = await detachTrackFromHike({ hikeId: hike.id, trackId });

        if (result.success) {
          setAttachedTrackIds((current) => current.filter((id) => id !== trackId));
          toast.success("Track detached");
        } else {
          toast.error("Track association not found");
        }

        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to detach track");
      } finally {
        setPendingTrackId(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{hike ? `Manage tracks for ${hike.title}` : "Manage tracks"}</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[70vh] gap-6 overflow-y-auto pr-1">
          <section className="grid gap-3">
            <h3 className="text-sm font-medium">Attached tracks</h3>
            {attachedTracks.length > 0 ? (
              <div className="grid gap-2">
                {attachedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{track.title}</div>
                      <Badge variant={track.status === "PUBLISHED" ? "default" : "secondary"}>
                        {formatTrackStatus(track.status)}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingTrackId === track.id}
                      onClick={() => handleDetach(track.id)}
                    >
                      <Unlink />
                      Detach
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">No tracks attached.</div>
            )}
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-medium">Available tracks</h3>
            {availableTracks.length > 0 ? (
              <div className="grid gap-2">
                {availableTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{track.title}</div>
                      <Badge variant={track.status === "PUBLISHED" ? "default" : "secondary"}>
                        {formatTrackStatus(track.status)}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingTrackId === track.id}
                      onClick={() => handleAttach(track.id)}
                    >
                      <Link2 />
                      Attach
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Every available track is already attached.
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const HikePhotosDialog = ({
  hike,
  photos,
  open,
  onOpenChange,
  onChanged,
}: {
  hike: HikeListItem | null;
  photos: HikePhotoOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) => {
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);
  const [attachedPhotoIds, setAttachedPhotoIds] = useState<string[]>([]);
  const [matchingPhoto, setMatchingPhoto] = useState<HikePhotoOption | null>(null);
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);
  const [, startChanging] = useTransition();
  const photosById = useMemo(() => new Map(photos.map((photo) => [photo.id, photo])), [photos]);
  const associatedPhotoIds = useMemo(() => new Set(attachedPhotoIds), [attachedPhotoIds]);
  const matchTracks = useMemo(() => toTrackTimeMatchTracks(hike), [hike]);
  const attachedPhotos = attachedPhotoIds.flatMap((photoId) => {
    const photo = photosById.get(photoId);

    return photo ? [photo] : [];
  });
  const availablePhotos = photos.filter((photo) => !associatedPhotoIds.has(photo.id));
  const matchCandidates = useMemo(
    () => (matchingPhoto ? proposeTrackTimeMatchCandidates(matchingPhoto.trackTimeMatch, matchTracks) : []),
    [matchTracks, matchingPhoto],
  );

  useEffect(() => {
    if (!open) return;

    setAttachedPhotoIds(hike?.photos.map(({ photo }) => photo.id) ?? []);
  }, [hike, open]);

  const handleAttach = (photoId: string) => {
    if (!hike) return;

    setPendingPhotoId(photoId);
    startChanging(async () => {
      try {
        await attachPhotoToHike({ hikeId: hike.id, photoId });
        setAttachedPhotoIds((current) => (current.includes(photoId) ? current : [...current, photoId]));
        toast.success("Photo attached");
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to attach photo");
      } finally {
        setPendingPhotoId(null);
      }
    });
  };

  const handleDetach = (photoId: string) => {
    if (!hike) return;

    setPendingPhotoId(photoId);
    startChanging(async () => {
      try {
        const result = await detachPhotoFromHike({ hikeId: hike.id, photoId });

        if (result.success) {
          setAttachedPhotoIds((current) => current.filter((id) => id !== photoId));
          toast.success("Photo detached");
        } else {
          toast.error("Photo association not found");
        }

        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to detach photo");
      } finally {
        setPendingPhotoId(null);
      }
    });
  };

  const handleMove = (photoId: string, direction: -1 | 1) => {
    if (!hike) return;

    const currentIndex = attachedPhotoIds.indexOf(photoId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= attachedPhotoIds.length) return;

    const nextPhotoIds = [...attachedPhotoIds];
    const [movedPhotoId] = nextPhotoIds.splice(currentIndex, 1);
    nextPhotoIds.splice(nextIndex, 0, movedPhotoId);
    setPendingPhotoId(photoId);

    startChanging(async () => {
      try {
        await reorderHikePhotos({ hikeId: hike.id, photoIds: nextPhotoIds });
        setAttachedPhotoIds(nextPhotoIds);
        toast.success("Photo order updated");
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reorder photos");
      } finally {
        setPendingPhotoId(null);
      }
    });
  };

  const handleAcceptCandidate = (candidate: TrackTimeMatchCandidate) => {
    if (!hike || !matchingPhoto) return;

    setPendingCandidateId(candidate.id);
    startChanging(async () => {
      try {
        await acceptHikePhotoTrackTimeMatchCandidate({
          hikeId: hike.id,
          photoId: matchingPhoto.id,
          candidateId: candidate.id,
        });
        toast.success("Track-time match logged");
        setMatchingPhoto(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to log match candidate");
      } finally {
        setPendingCandidateId(null);
      }
    });
  };

  const PhotoRow = ({ photo, index }: { photo: HikePhotoOption; index?: number }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {photo.previewImage ? (
            <img src={photo.previewImage.url} alt={photo.previewImage.name} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium" title={photo.title}>
            {photo.title}
          </div>
          <Badge variant={photo.status === "PUBLISHED" ? "default" : "secondary"}>
            {formatPhotoStatus(photo.status)}
          </Badge>
        </div>
      </div>
      {typeof index === "number" ? (
        <div className="flex gap-1">
          {photo.status === "PUBLISHED" && !photo.trackTimeMatch.hasDirectGps && photo.trackTimeMatch.capturedAt ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Review track-time match"
              disabled={pendingPhotoId === photo.id}
              onClick={() => setMatchingPhoto(photo)}
            >
              <Clock3 className="size-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Move photo up"
            disabled={pendingPhotoId === photo.id || index === 0}
            onClick={() => handleMove(photo.id, -1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Move photo down"
            disabled={pendingPhotoId === photo.id || index === attachedPhotos.length - 1}
            onClick={() => handleMove(photo.id, 1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingPhotoId === photo.id}
            onClick={() => handleDetach(photo.id)}
          >
            <Unlink />
            Detach
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingPhotoId === photo.id}
          onClick={() => handleAttach(photo.id)}
        >
          <Link2 />
          Attach
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{hike ? `Manage photos for ${hike.title}` : "Manage photos"}</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-6 overflow-y-auto pr-1">
            <section className="grid gap-3">
              <h3 className="text-sm font-medium">Attached photos</h3>
              {attachedPhotos.length > 0 ? (
                <div className="grid gap-2">
                  {attachedPhotos.map((photo, index) => (
                    <PhotoRow key={photo.id} photo={photo} index={index} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">No photos attached.</div>
              )}
            </section>
            <section className="grid gap-3">
              <h3 className="text-sm font-medium">Available photos</h3>
              {availablePhotos.length > 0 ? (
                <div className="grid gap-2">
                  {availablePhotos.map((photo) => (
                    <PhotoRow key={photo.id} photo={photo} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  Every available photo is already attached.
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(matchingPhoto)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMatchingPhoto(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {matchingPhoto ? `Track-time match for ${matchingPhoto.title}` : "Track-time match"}
            </DialogTitle>
            <DialogDescription>
              Spike only: timestamps are compared as parseable absolute times. Accepting a candidate logs it for
              evaluation and does not save coordinates or add a public map marker.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
            {matchingPhoto?.trackTimeMatch.capturedAt ? (
              <div className="text-sm text-muted-foreground">
                Captured at {formatDateTime(matchingPhoto.trackTimeMatch.capturedAt)}
              </div>
            ) : null}
            {matchCandidates.length > 0 ? (
              matchCandidates.map((candidate) => (
                <div key={candidate.id} className="grid gap-3 rounded-md border p-3">
                  <div className="grid gap-1">
                    <Badge variant="outline" className="w-fit">
                      {candidate.type === "INSIDE_TRACK_WINDOW" ? "Inside track window" : "Between tracks"}
                    </Badge>
                    <div className="text-sm">{candidate.explanation}</div>
                    <div className="text-xs text-muted-foreground">
                      {candidate.type === "INSIDE_TRACK_WINDOW"
                        ? `${formatDateTime(candidate.trackStart)} - ${formatDateTime(candidate.trackEnd)}`
                        : `${formatDateTime(candidate.previousTrackEnd)} - ${formatDateTime(candidate.nextTrackStart)}`}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={pendingCandidateId === candidate.id}
                      onClick={() => handleAcceptCandidate(candidate)}
                    >
                      Log choice
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                No track-time candidates found from the currently attached published tracks. Tracks need stored
                recording start/end times; between-track matches also need a short enough gap and nearby endpoints when
                endpoint geometry is available.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const HikesAdminPanel = ({
  hikes,
  tracks,
  photos,
}: {
  hikes: HikeListItem[];
  tracks: HikeTrackOption[];
  photos: HikePhotoOption[];
}) => {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHike, setEditingHike] = useState<HikeListItem | null>(null);
  const [managingTracksHike, setManagingTracksHike] = useState<HikeListItem | null>(null);
  const [managingPhotosHike, setManagingPhotosHike] = useState<HikeListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HikeListItem | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const columns = useMemo<ColumnDef<HikeListItem>[]>(
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
        accessorKey: "startDate",
        header: "Dates",
        cell: ({ row }) => getDateRange(row.original),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{formatHikeType(row.original.type)}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "PUBLISHED" ? "default" : "secondary"}>
            {formatHikeStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "tracks",
        header: "Tracks",
        cell: ({ row }) => (
          <div className="flex max-w-48 flex-wrap gap-1">
            {row.original.tracks.length > 0 ? (
              row.original.tracks.slice(0, 3).map(({ track }) => (
                <Badge key={track.id} variant={track.status === "PUBLISHED" ? "default" : "secondary"}>
                  {track.title}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">None</span>
            )}
            {row.original.tracks.length > 3 ? <Badge variant="outline">+{row.original.tracks.length - 3}</Badge> : null}
          </div>
        ),
      },
      {
        id: "photos",
        header: "Photos",
        cell: ({ row }) => (
          <div className="flex max-w-48 flex-wrap gap-1">
            {row.original.photos.length > 0 ? (
              row.original.photos.slice(0, 3).map(({ photo }) => (
                <Badge key={photo.id} variant={photo.status === "PUBLISHED" ? "default" : "secondary"}>
                  {photo.title}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">None</span>
            )}
            {row.original.photos.length > 3 ? <Badge variant="outline">+{row.original.photos.length - 3}</Badge> : null}
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
              title="Manage tracks"
              onClick={() => setManagingTracksHike(row.original)}
            >
              <Route className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Manage photos"
              onClick={() => setManagingPhotosHike(row.original)}
            >
              <ImageIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Edit hike"
              onClick={() => {
                setEditingHike(row.original);
                setFormOpen(true);
              }}
            >
              <Edit className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Delete hike"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleCreateClick = () => {
    setEditingHike(null);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    startDeleting(async () => {
      const result = await deleteHike(deleteTarget.id);

      if (result.success) {
        toast.success("Hike deleted");
      } else {
        toast.error("Hike not found");
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
          Add hike
        </Button>
      </div>
      <DataTable data={hikes} columns={columns} pagination={{ pageSize: 10 }} />
      <HikeFormDialog
        hike={editingHike}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingHike(null);
        }}
      />
      <HikeTracksDialog
        hike={managingTracksHike}
        tracks={tracks}
        open={Boolean(managingTracksHike)}
        onChanged={() => router.refresh()}
        onOpenChange={(open) => {
          if (!open) setManagingTracksHike(null);
        }}
      />
      <HikePhotosDialog
        hike={managingPhotosHike}
        photos={photos}
        open={Boolean(managingPhotosHike)}
        onChanged={() => router.refresh()}
        onOpenChange={(open) => {
          if (!open) setManagingPhotosHike(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete hike?"
        description={
          deleteTarget ? `This will remove "${deleteTarget.title}" from admin and public hike lists.` : undefined
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

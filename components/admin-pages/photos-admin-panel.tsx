"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, ImageIcon, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import {
  createPhoto,
  deletePhoto,
  refreshPhotoExifMetadata,
  updatePhoto,
  type PhotoListItem,
} from "@/app/_data/photos";
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
import type { PhotoStatus } from "@/generated/prisma/enums";
import { OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT, OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE } from "@/lib/file-upload-limits";
import { formatHikeDateRange, formatHikeStatus, formatHikeType } from "@/lib/hikes";
import {
  formatPhotoCapturedAt,
  formatPhotoDimensions,
  formatPhotoGpsPresence,
  getPhotoExifMetadataState,
  type PhotoExifMetadataState,
} from "@/lib/photo-exif-metadata";
import { PHOTO_IMAGE_MAX_COUNT, formatPhotoStatus, photoStatusOptions } from "@/lib/photos";
import { UploadDropzone } from "@/lib/uploadthing";

type SelectedPhotoImage = {
  fileAssetId: string;
  name: string;
  url: string;
};

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  images: z
    .array(
      z.object({
        fileAssetId: z.string().min(1),
        name: z.string().min(1),
        url: z.string().min(1),
      }),
    )
    .min(1, { message: "At least one photo image is required" })
    .max(PHOTO_IMAGE_MAX_COUNT, { message: `Photos can use at most ${PHOTO_IMAGE_MAX_COUNT} images` }),
});

type PhotoFormValues = z.infer<typeof formSchema>;

const defaultValues: PhotoFormValues = {
  title: "",
  description: "",
  status: "DRAFT",
  images: [],
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const getPhotoPreviewImage = (photo: PhotoListItem) => photo.images.at(0)?.fileAsset;

const getPhotoMetadataState = (photo: PhotoListItem): PhotoExifMetadataState =>
  getPhotoExifMetadataState(
    photo.metadata,
    photo.images.map((image) => ({
      fileAssetId: image.fileAssetId,
      fileKey: image.fileAsset.fileKey,
      sortOrder: image.sortOrder,
    })),
  );

const getMetadataStatusLabel = (state: PhotoExifMetadataState) => {
  if (state.status === "SUCCESS") return "Extracted";
  if (state.status === "FAILED") return "Failed";
  if (state.status === "STALE") return "Needs refresh";

  return "Not extracted";
};

const getMetadataStatusVariant = (state: PhotoExifMetadataState) => {
  if (state.status === "SUCCESS") return "default" as const;
  if (state.status === "FAILED") return "destructive" as const;

  return "outline" as const;
};

const PhotoMetadataStatus = ({ photo }: { photo: PhotoListItem }) => {
  const state = getPhotoMetadataState(photo);
  const capturedAt = state.status === "SUCCESS" ? formatPhotoCapturedAt(state.summary.capturedAt) : null;
  const dimensions =
    state.status === "SUCCESS" ? formatPhotoDimensions(state.summary.width, state.summary.height) : null;
  const camera = state.status === "SUCCESS" ? state.summary.cameraLabel : null;
  const gps = state.status === "SUCCESS" ? formatPhotoGpsPresence(state.summary.gps) : null;

  return (
    <div className="flex max-w-64 flex-col gap-1">
      <div>
        <Badge variant={getMetadataStatusVariant(state)}>{getMetadataStatusLabel(state)}</Badge>
      </div>
      {state.status === "SUCCESS" ? (
        <div className="text-xs text-muted-foreground">
          {[capturedAt, dimensions, camera, gps].filter(Boolean).join(" · ")}
        </div>
      ) : null}
      {state.status === "FAILED" || state.status === "STALE" ? (
        <div className="line-clamp-2 text-xs text-muted-foreground">{state.errorMessage}</div>
      ) : null}
    </div>
  );
};

const PhotoImagesField = ({
  images,
  onRemove,
}: {
  images: SelectedPhotoImage[];
  onRemove: (fileAssetId: string) => void;
}) => (
  <div className="grid gap-2">
    {images.length > 0 ? (
      <div className="grid gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <div key={image.fileAssetId} className="overflow-hidden rounded-md border">
            <div className="aspect-video bg-muted">
              <img src={image.url} alt={image.name} className="size-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <div className="min-w-0">
                <div className="font-medium">Image {index + 1}</div>
                <div className="truncate text-muted-foreground" title={image.name}>
                  {image.name}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title={`Remove ${image.name}`}
                aria-label={`Remove ${image.name}`}
                onClick={() => onRemove(image.fileAssetId)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No images selected
      </div>
    )}
  </div>
);

const PhotoFormDialog = ({
  photo,
  open,
  onOpenChange,
  onRefresh,
  refreshingPhotoId,
  onSaved,
}: {
  photo: PhotoListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: (photo: PhotoListItem) => void;
  refreshingPhotoId: string | null;
  onSaved: () => void;
}) => {
  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });
  const isEditing = Boolean(photo);
  const images = useWatch({ control: form.control, name: "images" });
  const metadataState = photo ? getPhotoMetadataState(photo) : null;
  const isRefreshing = Boolean(photo && refreshingPhotoId === photo.id);

  useEffect(() => {
    if (!open) return;

    if (photo) {
      form.reset({
        title: photo.title,
        description: photo.description ?? "",
        status: photo.status,
        images: photo.images.map((image) => ({
          fileAssetId: image.fileAssetId,
          name: image.fileAsset.name,
          url: image.fileAsset.url,
        })),
      });
    } else {
      form.reset(defaultValues);
    }
  }, [form, photo, open]);

  const setImages = (nextImages: SelectedPhotoImage[]) => {
    form.setValue("images", nextImages, { shouldDirty: true, shouldValidate: true });
  };

  const removeImage = (fileAssetId: string) => {
    setImages(images.filter((image) => image.fileAssetId !== fileAssetId));
  };

  const onSubmit = async (values: PhotoFormValues) => {
    const photoPayload = {
      title: values.title,
      description: values.description,
      status: values.status as PhotoStatus,
      fileAssetIds: values.images.map((image) => image.fileAssetId),
    };

    try {
      if (photo) {
        await updatePhoto({
          id: photo.id,
          ...photoPayload,
        });
        toast.success("Photo updated");
      } else {
        await createPhoto(photoPayload);
        toast.success("Photo created");
      }

      onOpenChange(false);
      form.reset(defaultValues);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save photo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit photo" : "Create photo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
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
                        {photoStatusOptions.map((option) => (
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
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <PhotoImagesField images={images} onRemove={removeImage} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <UploadDropzone
              endpoint="outdoorPhotoImageUploader"
              content={{
                label: "Drop or click to upload outdoor photo images",
                allowedContent: `Upload 1-${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT} images, up to ${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE} each.`,
              }}
              appearance={{
                button: "rounded-lg",
                container: "rounded-lg border",
              }}
              onUploadError={(error) => {
                toast.error(error.message || "Uploading photo images failed");
              }}
              onClientUploadComplete={(files) => {
                const uploadedImages = files.flatMap((file) => {
                  const fileAssetId = file.serverData?.fileAssetId;

                  return fileAssetId
                    ? [
                        {
                          fileAssetId,
                          name: file.name,
                          url: file.ufsUrl,
                        },
                      ]
                    : [];
                });

                if (uploadedImages.length !== files.length) {
                  toast.error("One or more uploaded images were not recorded");
                  return;
                }

                const nextImagesById = new Map(images.map((image) => [image.fileAssetId, image]));
                uploadedImages.forEach((image) => nextImagesById.set(image.fileAssetId, image));
                const nextImages = Array.from(nextImagesById.values());

                if (nextImages.length > PHOTO_IMAGE_MAX_COUNT) {
                  toast.error(`Photos can use at most ${PHOTO_IMAGE_MAX_COUNT} images`);
                  return;
                }

                setImages(nextImages);
                toast.success(uploadedImages.length === 1 ? "Image uploaded" : "Images uploaded");
              }}
            />
            {photo && metadataState ? (
              <div className="grid gap-3 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">EXIF metadata</span>
                    <Badge variant={getMetadataStatusVariant(metadataState)}>
                      {getMetadataStatusLabel(metadataState)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing || form.formState.isDirty}
                    onClick={() => onRefresh(photo)}
                  >
                    <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
                    {isRefreshing
                      ? "Refreshing..."
                      : metadataState.status === "SUCCESS"
                        ? "Refresh metadata"
                        : "Extract metadata"}
                  </Button>
                </div>
                {metadataState.status === "SUCCESS" ? (
                  <div className="flex flex-wrap gap-3 text-muted-foreground">
                    <span>{formatPhotoCapturedAt(metadataState.summary.capturedAt) ?? "No capture date"}</span>
                    <span>
                      {formatPhotoDimensions(metadataState.summary.width, metadataState.summary.height) ??
                        "No dimensions"}
                    </span>
                    <span>{metadataState.summary.cameraLabel ?? "No camera"}</span>
                    <span>{formatPhotoGpsPresence(metadataState.summary.gps)}</span>
                    <span>Parsed {formatDate(metadataState.metadata.exifParse.parsedAt)}</span>
                  </div>
                ) : null}
                {metadataState.status === "FAILED" || metadataState.status === "STALE" ? (
                  <div className="text-muted-foreground">{metadataState.errorMessage}</div>
                ) : null}
                {metadataState.status === "MISSING" ? (
                  <div className="text-muted-foreground">
                    Metadata has not been extracted yet. Extract to read capture date, camera, and GPS when available.
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting || images.length === 0}>
                {form.formState.isSubmitting ? "Saving..." : "Save photo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const PhotosAdminPanel = ({ photos }: { photos: PhotoListItem[] }) => {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PhotoListItem | null>(null);
  const [refreshingPhotoId, setRefreshingPhotoId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const handleRefresh = useCallback(
    (photo: PhotoListItem) => {
      setRefreshingPhotoId(photo.id);

      void (async () => {
        try {
          const metadata = await refreshPhotoExifMetadata(photo.id);

          if (metadata.exifParse.status === "SUCCESS") {
            toast.success("Photo metadata extracted");
          } else {
            toast.error(metadata.exifParse.errorMessage ?? "Photo metadata extraction failed");
          }

          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Photo metadata extraction failed");
        } finally {
          setRefreshingPhotoId(null);
        }
      })();
    },
    [router],
  );

  const columns = useMemo<ColumnDef<PhotoListItem>[]>(
    () => [
      {
        id: "preview",
        header: "",
        cell: ({ row }) => {
          const preview = getPhotoPreviewImage(row.original);

          return (
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {preview ? (
                <img src={preview.url} alt={row.original.title} className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
            </div>
          );
        },
      },
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
        id: "imageCount",
        header: "Images",
        cell: ({ row }) => <span className="text-sm">{row.original.images.length}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "PUBLISHED" ? "default" : "secondary"}>
            {formatPhotoStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "metadata",
        header: "EXIF summary",
        cell: ({ row }) => <PhotoMetadataStatus photo={row.original} />,
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
              title="Extract metadata"
              disabled={refreshingPhotoId === row.original.id}
              onClick={() => handleRefresh(row.original)}
            >
              <RefreshCw className={`size-4 ${refreshingPhotoId === row.original.id ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Edit photo"
              onClick={() => {
                setEditingPhoto(row.original);
                setFormOpen(true);
              }}
            >
              <Edit className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Delete photo"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleRefresh, refreshingPhotoId],
  );

  const handleCreateClick = () => {
    setEditingPhoto(null);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    startDeleting(async () => {
      const result = await deletePhoto(deleteTarget.id);

      if (result.success) {
        toast.success("Photo deleted");
      } else {
        toast.error("Photo not found");
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
          Add photo
        </Button>
      </div>
      <DataTable data={photos} columns={columns} pagination={{ pageSize: 10 }} />
      <PhotoFormDialog
        photo={editingPhoto}
        open={formOpen}
        onRefresh={handleRefresh}
        refreshingPhotoId={refreshingPhotoId}
        onSaved={() => router.refresh()}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPhoto(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete photo?"
        description={deleteTarget ? `This will remove "${deleteTarget.title}" from the admin photos list.` : undefined}
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

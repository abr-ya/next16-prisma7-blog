"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from "@/components/index";
import { OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT, OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE } from "@/lib/file-upload-limits";
import { UploadDropzone } from "@/lib/uploadthing";

export type PhotoUploadDialogImage = { fileAssetId: string; name: string; url: string };
export type PhotoUploadDialogValues = { title: string; description: string; images: PhotoUploadDialogImage[] };

const emptyValues: PhotoUploadDialogValues = { title: "", description: "", images: [] };

export const PhotoUploadDialog = ({
  open,
  onOpenChange,
  dialogTitle,
  submitLabel,
  initialValues = emptyValues,
  beforeDescription,
  afterUpload,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogTitle: string;
  submitLabel: string;
  initialValues?: PhotoUploadDialogValues;
  beforeDescription?: ReactNode;
  afterUpload?: (isDirty: boolean) => ReactNode;
  onSubmit: (values: PhotoUploadDialogValues) => Promise<void>;
}) => {
  const [values, setValues] = useState<PhotoUploadDialogValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  useEffect(() => {
    if (open) setValues(initialValues);
  }, [initialValues, open]);

  const submit = async () => {
    if (!values.title.trim() || values.images.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <label className="grid gap-2 text-sm font-medium">
              Title
              <Input
                value={values.title}
                onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                disabled={isSubmitting}
              />
            </label>
            {beforeDescription}
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Description
            <textarea
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              disabled={isSubmitting}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            />
          </label>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Images</span>
            {values.images.length ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {values.images.map((image, index) => (
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
                        disabled={isSubmitting}
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            images: current.images.filter((item) => item.fileAssetId !== image.fileAssetId),
                          }))
                        }
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
          <UploadDropzone
            endpoint="outdoorPhotoImageUploader"
            content={{
              label: "Drop or click to upload outdoor photo images",
              allowedContent: `Upload 1-${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT} images, up to ${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE} each.`,
            }}
            appearance={{ button: "rounded-lg", container: "rounded-lg border" }}
            onUploadError={(error) => {
              toast.error(error.message || "Uploading photo images failed");
            }}
            onClientUploadComplete={(files) => {
              const uploadedImages = files.flatMap((file) =>
                file.serverData?.fileAssetId
                  ? [{ fileAssetId: file.serverData.fileAssetId, name: file.name, url: file.ufsUrl }]
                  : [],
              );
              if (uploadedImages.length !== files.length) {
                toast.error("One or more uploaded images were not recorded");
                return;
              }
              setValues((current) => {
                const nextImages = Array.from(
                  new Map([...current.images, ...uploadedImages].map((image) => [image.fileAssetId, image])).values(),
                );
                if (nextImages.length > OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT) {
                  toast.error(`Photos can use at most ${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT} images`);
                  return current;
                }
                return { ...current, images: nextImages };
              });
              toast.success(uploadedImages.length === 1 ? "Image uploaded" : "Images uploaded");
            }}
          />
          {afterUpload?.(isDirty)}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={submit}
              disabled={isSubmitting || !values.title.trim() || values.images.length === 0}
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

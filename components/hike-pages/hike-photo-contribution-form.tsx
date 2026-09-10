"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { contributePhotoToHike, type HikePhotoContributionCapability } from "@/app/_data/hikes";
import { Button, Input } from "@/components/index";
import { OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT, OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE } from "@/lib/file-upload-limits";
import { UploadDropzone } from "@/lib/uploadthing";

type SelectedPhotoImage = {
  fileAssetId: string;
  name: string;
};

export const HikePhotoContributionForm = ({ capability }: { capability: HikePhotoContributionCapability }) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<SelectedPhotoImage[]>([]);
  const [isPending, startTransition] = useTransition();
  const limitReached = capability.remainingPhotoCount === 0;

  const submit = () => {
    startTransition(async () => {
      try {
        await contributePhotoToHike({
          hikeId: capability.hikeId,
          title,
          description,
          fileAssetIds: images.map((image) => image.fileAssetId),
        });
        setTitle("");
        setDescription("");
        setImages([]);
        router.refresh();
        toast.success("Photo added to trip");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add photo to trip");
      }
    });
  };

  return (
    <section className="grid gap-3 rounded-md border p-4">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold">Add photos</h2>
        <p className="text-sm text-muted-foreground">
          {capability.remainingPhotoCount === null
            ? "Add one photo with up to three images."
            : limitReached
              ? "You have reached your 10-photo limit for this trip."
              : `${capability.remainingPhotoCount} of 10 photo contributions remaining for this trip.`}
        </p>
      </div>
      {!limitReached ? (
        <>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Photo title"
            disabled={isPending}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            disabled={isPending}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          />
          <UploadDropzone
            endpoint="outdoorPhotoImageUploader"
            content={{
              label: "Drop or click to upload trip photo images",
              allowedContent: `Upload 1-${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT} images, up to ${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE} each.`,
            }}
            appearance={{ button: "rounded-lg", container: "rounded-lg border" }}
            onUploadError={(error) => {
              toast.error(error.message || "Uploading photo images failed");
            }}
            onClientUploadComplete={(files) => {
              const uploadedImages = files.flatMap((file) => {
                const fileAssetId = file.serverData?.fileAssetId;
                return fileAssetId ? [{ fileAssetId, name: file.name }] : [];
              });
              if (uploadedImages.length !== files.length) {
                toast.error("One or more uploaded images were not recorded");
                return;
              }

              const nextImages = Array.from(
                new Map([...images, ...uploadedImages].map((image) => [image.fileAssetId, image])).values(),
              );
              if (nextImages.length > OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT) {
                toast.error(`A photo can use at most ${OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT} images`);
                return;
              }
              setImages(nextImages);
              toast.success(uploadedImages.length === 1 ? "Image uploaded" : "Images uploaded");
            }}
          />
          {images.length > 0 ? (
            <ul className="grid gap-1 text-sm text-muted-foreground">
              {images.map((image) => (
                <li key={image.fileAssetId}>{image.name}</li>
              ))}
            </ul>
          ) : null}
          <Button
            type="button"
            onClick={submit}
            disabled={isPending || !title.trim() || images.length === 0}
            className="w-fit"
          >
            {isPending ? "Adding photo…" : "Add photo"}
          </Button>
        </>
      ) : null}
    </section>
  );
};

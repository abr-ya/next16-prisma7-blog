"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { contributePhotoToHike, type HikePhotoContributionCapability } from "@/app/_data/hikes";
import { PhotoUploadDialog, type PhotoUploadDialogValues } from "@/components/common/photo-upload-dialog";
import { Button } from "@/components/index";

export const HikePhotoContributionForm = ({ capability }: { capability: HikePhotoContributionCapability }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const limitReached = capability.remainingPhotoCount === 0;

  const submit = async (values: PhotoUploadDialogValues) => {
    try {
      await contributePhotoToHike({
        hikeId: capability.hikeId,
        title: values.title,
        description: values.description,
        fileAssetIds: values.images.map((image) => image.fileAssetId),
      });
      router.refresh();
      toast.success("Photo added to trip");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add photo to trip");
      throw error;
    }
  };

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-md border p-4">
      <div className="mr-auto grid gap-1">
        <h2 className="text-base font-semibold">Trip photos</h2>
        <p className="text-sm text-muted-foreground">
          {capability.remainingPhotoCount === null
            ? "Add one photo with up to three images."
            : limitReached
              ? "You have reached your 10-photo limit for this trip."
              : `${capability.remainingPhotoCount} of 10 photo contributions remaining for this trip.`}
        </p>
      </div>
      <Button type="button" disabled={limitReached} onClick={() => setOpen(true)}>
        Add photo
      </Button>
      <PhotoUploadDialog
        open={open}
        onOpenChange={setOpen}
        dialogTitle="Add photo to trip"
        submitLabel="Add photo"
        onSubmit={submit}
      />
    </section>
  );
};

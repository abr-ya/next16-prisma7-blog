"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { contributePhotoToHike, type HikePhotoContributionCapability } from "@/app/_data/hikes";
import { PhotoUploadDialog, type PhotoUploadDialogValues } from "@/components/common/photo-upload-dialog";
import { Button } from "@/components/index";

export const HikePhotoContributionButton = ({ capability }: { capability: HikePhotoContributionCapability }) => {
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
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={limitReached}
          title={limitReached ? "You have reached your 10-photo limit for this trip." : undefined}
          onClick={() => setOpen(true)}
        >
          Add photo
        </Button>
        {limitReached ? <span className="text-xs text-muted-foreground">10-photo limit reached</span> : null}
      </div>
      <PhotoUploadDialog
        open={open}
        onOpenChange={setOpen}
        dialogTitle="Add photo to trip"
        submitLabel="Add photo"
        multiImageOptIn={{ label: "Add more images to this photo (up to 3)" }}
        onSubmit={submit}
      />
    </>
  );
};

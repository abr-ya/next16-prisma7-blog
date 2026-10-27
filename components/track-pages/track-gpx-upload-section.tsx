"use client";

import { toast } from "sonner";

import { TRACK_GPX_UPLOAD_MAX_SIZE } from "@/lib/file-upload-limits";
import { UploadDropzone } from "@/lib/uploadthing";

/**
 * Shared GPX upload subform used by the owner-workspace track dialog
 * (`/admin/tracks`, `/my/tracks`) and the trip-side contribution dialog
 * (`/trips/[slug]`). The section is intentionally minimal — it owns the
 * UploadDropzone, file validation messaging, and the upload-success/error
 * toasts, and delegates the rest of the form lifecycle (form state, dirty-close
 * guard, parse-GPX affordance, and the read-only file display) to the parent.
 *
 * The parent is responsible for:
 *
 * - Tracking every uploaded `fileAssetId` for the dirty-close guard and for
 *   invoking the existing `markDiscardedTrackGpxFileAssetsPendingDelete`
 *   helper when the dialog is closed without saving.
 * - Rendering the read-only "currently selected file" display and the parse-GPX
 *   affordance (only relevant in the owner-workspace edit flow).
 */
export const TrackGpxUploadSection = ({
  isEditing,
  onUploadComplete,
  onUploadError,
  onBeforeUpload,
}: {
  isEditing: boolean;
  onUploadComplete: (params: { fileAssetId: string; fileName: string }) => void;
  onUploadError: (message: string) => void;
  // feature-123: the quick upload dialog reads the dropped file in the browser
  // before the upload finishes, to suggest a title from it. The prop is
  // optional — the two existing consumers pass nothing, and the upload itself
  // is unaffected by what the handler does with the files.
  onBeforeUpload?: (files: File[]) => void;
}) => {
  return (
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
      onBeforeUploadBegin={(files) => {
        onBeforeUpload?.(files);
        return files;
      }}
      onUploadError={(error) => {
        const message = error.message || "Uploading GPX failed";
        onUploadError(message);
        toast.error(message);
      }}
      onClientUploadComplete={(files) => {
        const uploaded = files.at(0);
        const fileAssetId = uploaded?.serverData?.fileAssetId;

        if (!fileAssetId) {
          onUploadError("Uploaded GPX was not recorded");
          toast.error("Uploaded GPX was not recorded");
          return;
        }

        onUploadComplete({ fileAssetId, fileName: uploaded.name });
        toast.success("GPX uploaded");
      }}
    />
  );
};

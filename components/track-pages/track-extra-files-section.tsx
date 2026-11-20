"use client";

import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { addTrackExtraFile, removeTrackExtraFile, type PublicTrackSecondaryFile } from "@/app/_data/tracks";
import { Badge, Button, ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/index";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import { formatFileSize } from "@/lib/file-upload-limits";

// feature-143: the owner's secondary-file section. The same list is rendered
// for every viewer; the add and remove controls only exist for the owner, and
// the server remains the authority.

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const TrackExtraFilesSection = ({
  trackId,
  files,
  canManage,
}: {
  trackId: string;
  files: PublicTrackSecondaryFile[];
  canManage: boolean;
}) => {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PublicTrackSecondaryFile | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  if (files.length === 0 && !canManage) return null;

  const closeAddDialog = async (nextOpen: boolean) => {
    if (nextOpen || isAdding) return;

    if (uploadedFileId) {
      await markDiscardedTrackGpxFileAssetsPendingDelete([uploadedFileId]).catch(() => undefined);
    }

    setUploadedFileId(null);
    setAddOpen(false);
  };

  const handleUploaded = async ({ fileAssetId }: { fileAssetId: string; fileName: string }) => {
    setUploadedFileId(fileAssetId);
    setIsAdding(true);

    try {
      const result = await addTrackExtraFile(trackId, fileAssetId);

      if (!result.ok) {
        toast.error(result.message);
        await markDiscardedTrackGpxFileAssetsPendingDelete([fileAssetId]).catch(() => undefined);
        setUploadedFileId(null);

        return;
      }

      toast.success("Extra file added");
      setUploadedFileId(null);
      setAddOpen(false);
      router.refresh();
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;

    setIsRemoving(true);

    try {
      const result = await removeTrackExtraFile(removeTarget.geometryId);

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success("Extra file removed");
      setRemoveTarget(null);
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <section className="grid gap-3 rounded-md border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold">Extra files</h2>
            <p className="text-sm text-muted-foreground">
              Track-owned files kept beside the primary geometry. They add a map line but never change the primary
              distance or time.
            </p>
          </div>
          {canManage ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus />
              Add extra GPX
            </Button>
          ) : null}
        </div>

        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No extra files yet.</p>
        ) : (
          files.map((file) => (
            <div key={file.geometryId} className="grid gap-3 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="font-medium">{file.name}</span>
                <Badge variant="outline">{formatFileSize(file.sizeBytes)}</Badge>
                {canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    title="Remove extra file"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setRemoveTarget(file)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Upload className="size-3.5" />
                  Uploaded {formatDate(file.uploadedAt)}
                </span>
                <span>File updated {formatDate(file.updatedAt)}</span>
              </div>
              <div>
                {file.downloadUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={file.downloadUrl}>
                      <Download />
                      Download GPX
                    </Link>
                  </Button>
                ) : (
                  <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                    This file is not available for download.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={(open) => void closeAddDialog(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add extra GPX</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              The file is parsed and drawn beside the primary geometry. It does not change the primary distance or time.
            </p>
            <TrackGpxUploadSection
              isEditing={false}
              onUploadComplete={(params) => void handleUploaded(params)}
              onUploadError={(message) => toast.error(message)}
            />
            {isAdding ? <p className="text-sm text-muted-foreground">Saving…</p> : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title="Remove extra file?"
        description={
          removeTarget
            ? `"${removeTarget.name}" will be detached from this workout and its file marked for deletion. The primary geometry is not affected.`
            : undefined
        }
        confirmLabel="Remove file"
        confirmVariant="destructive"
        isPending={isRemoving}
        onConfirm={handleRemove}
      />
    </>
  );
};

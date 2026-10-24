"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";

type DiscardGuardedTrackFormOptions = {
  /**
   * Id of the file asset already saved on the edited record, if any. Uploads
   * with this id are kept, not discarded — only freshly uploaded files are
   * marked for deletion.
   */
  savedFileAssetId?: string | null;
  /** Whether the form itself holds unsaved edits. */
  hasUnsavedChanges?: boolean;
  /** Whether unsaved map points are staged (the admin "place on map" flow). */
  hasUnsavedPoints?: boolean;
  /** Resets the form fields and any staged map points. */
  resetFormState: () => void;
  /** Opens / closes the surrounding dialog. */
  onOpenChange: (open: boolean) => void;
  /** Success toast after a successful discard. Omit for no success toast. */
  discardedMsg?: string;
};

type DiscardGuardedTrackForm = {
  /** Registers a freshly uploaded file asset id. */
  registerUploadedFileAssetId: (fileAssetId: string) => void;
  /** Uploaded ids that a discard would actually delete. */
  discardableFileAssetIds: string[];
  hasUnsavedUploads: boolean;
  hasGuardedChanges: boolean;
  /** Closes the dialog without asking, resetting the form. */
  closeWithoutGuard: () => void;
  /** The guarded `onOpenChange` for the surrounding dialog. */
  handleOpenChange: (nextOpen: boolean) => void;
  /** Clears the uploaded ids and closes the confirm dialog, keeping the form open. */
  resetDiscardState: () => void;
  confirmDialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: "destructive";
    isPending: boolean;
    onConfirm: () => void;
  };
};

/**
 * Owns the "discard unsaved changes" lifecycle shared by the admin track form
 * and the public trip-page track form.
 *
 * The two forms guard different things and toast different messages, so the
 * differences are options rather than a unified behavior. See
 * `openspec/changes/refactor-003-discard-guarded-track-form/design.md`.
 *
 * The hook deliberately does NOT reset the uploaded ids when the dialog opens:
 * the two forms reset them differently today, and normalizing that would
 * change what the user sees.
 */
export const useDiscardGuardedTrackForm = ({
  savedFileAssetId = null,
  hasUnsavedChanges = false,
  hasUnsavedPoints = false,
  resetFormState,
  onOpenChange,
  discardedMsg,
}: DiscardGuardedTrackFormOptions): DiscardGuardedTrackForm => {
  const [uploadedFileAssetIds, setUploadedFileAssetIds] = useState<string[]>([]);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [isDiscarding, startDiscarding] = useTransition();

  const discardableFileAssetIds = useMemo(
    () => uploadedFileAssetIds.filter((uploadedFileAssetId) => uploadedFileAssetId !== savedFileAssetId),
    [savedFileAssetId, uploadedFileAssetIds],
  );

  const hasUnsavedUploads = discardableFileAssetIds.length > 0;
  const hasGuardedChanges = hasUnsavedUploads || hasUnsavedPoints || hasUnsavedChanges;

  const registerUploadedFileAssetId = useCallback((fileAssetId: string) => {
    setUploadedFileAssetIds((current) => (current.includes(fileAssetId) ? current : [...current, fileAssetId]));
  }, []);

  const resetDiscardState = useCallback(() => {
    setUploadedFileAssetIds([]);
    setDiscardConfirmOpen(false);
  }, []);

  const closeWithoutGuard = useCallback(() => {
    setDiscardConfirmOpen(false);
    setUploadedFileAssetIds([]);
    resetFormState();
    onOpenChange(false);
  }, [onOpenChange, resetFormState]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }

      if (hasGuardedChanges) {
        setDiscardConfirmOpen(true);
        return;
      }

      closeWithoutGuard();
    },
    [closeWithoutGuard, hasGuardedChanges, onOpenChange],
  );

  const handleConfirmDiscard = useCallback(() => {
    const fileIdsToDiscard = discardableFileAssetIds;

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

      if (discardedMsg) {
        toast.success(discardedMsg);
      }

      closeWithoutGuard();
    });
  }, [closeWithoutGuard, discardableFileAssetIds, discardedMsg]);

  const confirmDialogProps = {
    open: discardConfirmOpen,
    onOpenChange: setDiscardConfirmOpen,
    title: hasUnsavedUploads
      ? "Discard track and uploaded GPX?"
      : hasUnsavedPoints
        ? "Discard placed points?"
        : "Discard track changes?",
    description: hasUnsavedUploads
      ? "This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing."
      : hasUnsavedPoints
        ? "This form has unsaved changes and placed map points. Discarding will close the modal without saving them."
        : "This form has unsaved changes. Discarding will close the modal without saving them.",
    confirmLabel: hasUnsavedUploads ? "Discard and remove file" : "Discard changes",
    confirmVariant: "destructive" as const,
    isPending: isDiscarding,
    onConfirm: handleConfirmDiscard,
  };

  return {
    registerUploadedFileAssetId,
    discardableFileAssetIds,
    hasUnsavedUploads,
    hasGuardedChanges,
    closeWithoutGuard,
    handleOpenChange,
    resetDiscardState,
    confirmDialogProps,
  };
};

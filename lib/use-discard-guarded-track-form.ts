"use client";

import { useT } from "next-i18next/client";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { tripsNamespace } from "@/app/i18n/settings";

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
 * Owns the "discard unsaved changes" lifecycle shared by the admin track form,
 * the quick workout upload dialog and the public trip-page track form.
 *
 * The forms guard different things, so the differences are options rather than
 * a unified behavior. See
 * `openspec/changes/refactor-003-discard-guarded-track-form/design.md`.
 *
 * The guard's copy — titles, descriptions, button labels and toasts — comes
 * from the `trips` namespace (`discardGuard.*`), so every surface shows it in
 * the interface language.
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
}: DiscardGuardedTrackFormOptions): DiscardGuardedTrackForm => {
  const { t } = useT(tripsNamespace);
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
        toast.error(t(result.code === "NOT_OWNER" ? "discardGuard.errorNotOwner" : "discardGuard.errorNotSafe"));
        return;
      }

      toast.success(t("discardGuard.successToast"));

      closeWithoutGuard();
    });
  }, [closeWithoutGuard, discardableFileAssetIds, t]);

  const confirmDialogProps = {
    open: discardConfirmOpen,
    onOpenChange: setDiscardConfirmOpen,
    title: hasUnsavedUploads
      ? t("discardGuard.titleWithFile")
      : hasUnsavedPoints
        ? t("discardGuard.titleWithPoints")
        : t("discardGuard.titleChanges"),
    description: hasUnsavedUploads
      ? t("discardGuard.descriptionWithFile")
      : hasUnsavedPoints
        ? t("discardGuard.descriptionWithPoints")
        : t("discardGuard.descriptionChanges"),
    confirmLabel: hasUnsavedUploads ? t("discardGuard.confirmWithFile") : t("discardGuard.confirmChanges"),
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

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

// refactor-001: the delete-row confirmation lifecycle that
// `tracks-admin-panel.tsx`, `hikes-admin-panel.tsx`, and
// `photos-admin-panel.tsx` each carried as a near-verbatim copy. research-001
// graded it "lift (strong)" across all three; the handler bodies turned out to
// be byte-identical modulo the action name and two string literals.
//
// The hook returns a spreadable `confirmDialogProps` object rather than
// rendering `ConfirmDialog` itself, so the dialog stays a presentation concern
// of the panel. It deliberately adds no pending guard of its own:
// `components/common/confirm-dialog.tsx` already blocks re-entry with
// `if (isPending) return` and suppresses `onOpenChange` mid-flight.
//
// Lives in `lib/` next to `lib/track-row-actions.ts`, the existing precedent
// for a panel row-action hook (`useTrackRowActions` is imported by
// `tracks-admin-panel.tsx` from there).
type UseDeleteRowConfirmInput<T> = {
  /** Server action that takes a row id and reports whether it succeeded. */
  deleteAction: (id: string) => Promise<{ success: boolean }>;
  /** Dialog title, e.g. `"Delete track?"`. */
  title: string;
  /**
   * Builds the dialog description from the row. A builder rather than a shared
   * template because the three panels word their descriptions differently, not
   * just by entity noun.
   */
  getDescription: (row: T) => string;
  deletedMsg: string;
  notFoundMsg: string;
};

type UseDeleteRowConfirmResult<T extends { id: string }> = {
  target: T | null;
  setTarget: (row: T | null) => void;
  confirmDialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string | undefined;
    confirmLabel: string;
    confirmVariant: "destructive";
    isPending: boolean;
    onConfirm: () => void;
  };
};

const useDeleteRowConfirm = <T extends { id: string }>({
  deleteAction,
  title,
  getDescription,
  deletedMsg,
  notFoundMsg,
}: UseDeleteRowConfirmInput<T>): UseDeleteRowConfirmResult<T> => {
  const router = useRouter();
  const [target, setTarget] = useState<T | null>(null);
  const [isPending, startPending] = useTransition();

  const handleConfirm = () => {
    if (!target) return;

    startPending(async () => {
      const result = await deleteAction(target.id);

      if (result.success) {
        toast.success(deletedMsg);
      } else {
        toast.error(notFoundMsg);
      }

      // Both statements ran unconditionally in all three panels — on success
      // and on not-found alike. Moving them inside the success branch would be
      // a behavior change, not a cleanup: today a failed delete still closes
      // the dialog and refetches the table.
      setTarget(null);
      router.refresh();
    });
  };

  return {
    target,
    setTarget,
    confirmDialogProps: {
      open: Boolean(target),
      onOpenChange: (open) => {
        if (!open) setTarget(null);
      },
      title,
      description: target ? getDescription(target) : undefined,
      confirmLabel: "Delete",
      confirmVariant: "destructive",
      isPending,
      onConfirm: handleConfirm,
    },
  };
};

export { useDeleteRowConfirm };
export type { UseDeleteRowConfirmInput, UseDeleteRowConfirmResult };

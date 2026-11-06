"use client";

import type { ReactNode } from "react";
import { useT } from "next-i18next/client";

import { commonNamespace } from "@/app/i18n/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = "default",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useT(commonNamespace);
  const resolvedConfirmLabel = confirmLabel ?? t("confirmDialog.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("confirmDialog.cancel");

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (isPending) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={handleCancel}>
            {resolvedCancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} disabled={isPending} onClick={handleConfirm}>
            {resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import type { FormEvent, ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  VideoBookmarkForm,
  type VideoBookmarkFormValues,
} from "@/components/video-pages/video-bookmark-form";

type VideoBookmarkDialogMode = "create" | "edit";

type VideoBookmarkDialogProps = {
  mode: VideoBookmarkDialogMode;
  open: boolean;
  values: VideoBookmarkFormValues;
  disabled: boolean;
  submitIcon: ReactNode;
  onOpenChange: (open: boolean) => void;
  onChange: (values: VideoBookmarkFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  trigger?: ReactNode;
};

const dialogCopy = {
  create: {
    title: "Add bookmark",
    description: "Save a timestamp and optional notes for this video.",
    submitLabel: "Add bookmark",
    idPrefix: "new-video-bookmark",
  },
  edit: {
    title: "Edit bookmark",
    description: "Update the timestamp, label, or notes for this bookmark.",
    submitLabel: "Save",
    idPrefix: "edit-video-bookmark",
  },
} satisfies Record<
  VideoBookmarkDialogMode,
  {
    title: string;
    description: string;
    submitLabel: string;
    idPrefix: string;
  }
>;

export const VideoBookmarkDialog = ({
  mode,
  open,
  values,
  disabled,
  submitIcon,
  onOpenChange,
  onChange,
  onSubmit,
  trigger,
}: VideoBookmarkDialogProps) => {
  const copy = dialogCopy[mode];
  const descriptionId = `video-bookmark-${mode}-description`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent aria-describedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription id={descriptionId}>{copy.description}</DialogDescription>
        </DialogHeader>
        <VideoBookmarkForm
          values={values}
          idPrefix={copy.idPrefix}
          disabled={disabled}
          submitLabel={copy.submitLabel}
          submitIcon={submitIcon}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

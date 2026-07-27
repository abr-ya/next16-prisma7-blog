"use client";

import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type VideoBookmarkFormValues = {
  timestampSeconds: string;
  label: string;
  note: string;
};

export const emptyVideoBookmarkFormValues: VideoBookmarkFormValues = {
  timestampSeconds: "",
  label: "",
  note: "",
};

type VideoBookmarkFormProps = {
  values: VideoBookmarkFormValues;
  idPrefix: string;
  disabled: boolean;
  submitLabel: string;
  submitIcon: ReactNode;
  onChange: (values: VideoBookmarkFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const VideoBookmarkForm = ({
  values,
  idPrefix,
  disabled,
  submitLabel,
  submitIcon,
  onChange,
  onSubmit,
}: VideoBookmarkFormProps) => (
  <form className="grid gap-4" onSubmit={onSubmit}>
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-timestamp`}>
          Timestamp seconds
        </label>
        <Input
          id={`${idPrefix}-timestamp`}
          min={0}
          step={1}
          type="number"
          inputMode="numeric"
          value={values.timestampSeconds}
          disabled={disabled}
          onChange={(event) => onChange({ ...values, timestampSeconds: event.target.value })}
        />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-label`}>
          Label
        </label>
        <Input
          id={`${idPrefix}-label`}
          maxLength={80}
          value={values.label}
          disabled={disabled}
          onChange={(event) => onChange({ ...values, label: event.target.value })}
        />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-note`}>
          Note
        </label>
        <textarea
          id={`${idPrefix}-note`}
          maxLength={500}
          value={values.note}
          disabled={disabled}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 min-h-20 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          onChange={(event) => onChange({ ...values, note: event.target.value })}
        />
      </div>
    </div>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="submit" disabled={disabled}>
        {submitIcon}
        {submitLabel}
      </Button>
    </div>
  </form>
);

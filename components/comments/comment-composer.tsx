"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button, Spinner } from "@/components/index";

type CommentComposerProps = {
  id: string;
  label: string;
  placeholder: string;
  maxLength: number;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onSubmitError?: () => void;
};

export const CommentComposer = ({
  id,
  label,
  placeholder,
  maxLength,
  submitLabel,
  disabled = false,
  onSubmit,
  onSubmitError,
}: CommentComposerProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedContent = content.trim();
  const isSubmitDisabled = disabled || isSubmitting || trimmedContent.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) return;

    setIsSubmitting(true);

    try {
      await onSubmit(trimmedContent);
      setContent("");
    } catch {
      onSubmitError?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <textarea
          id={id}
          maxLength={maxLength}
          value={content}
          disabled={disabled || isSubmitting}
          placeholder={placeholder}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 min-h-24 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          onChange={(event) => setContent(event.target.value)}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {trimmedContent.length}/{maxLength}
        </p>
        <Button type="submit" disabled={isSubmitDisabled} className="w-full sm:w-auto">
          {isSubmitting ? <Spinner className="size-4" /> : <Send className="size-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

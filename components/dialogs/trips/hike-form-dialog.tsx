"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Form } from "@/components/index";
import type { HikeListItem } from "@/app/_data/hikes";
import { createSlug } from "@/lib/slug-generator";

import {
  dateInputValue,
  defaultHikeFormValues,
  HikeFormFields,
  hikeFormSchema,
  type HikeFormValues,
} from "@/components/forms/trips";

type HikeFormDialogProps = {
  hike: HikeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Surface owns the data layer (create / update / navigation). */
  onSubmit: (values: HikeFormValues) => Promise<void>;
};

/**
 * Reusable trip create/edit dialog used by both the administrator panel and the
 * public trip-creation surface. Owns form lifecycle (reset on open, dirty
 * handling) and the form field layout; defers the actual data call to the
 * surface-provided `onSubmit`.
 */
export const HikeFormDialog = ({ hike, open, onOpenChange, onSubmit }: HikeFormDialogProps) => {
  const form = useForm<HikeFormValues>({
    resolver: zodResolver(hikeFormSchema),
    defaultValues: defaultHikeFormValues,
    mode: "onBlur",
  });
  const isEditing = Boolean(hike);

  useEffect(() => {
    if (!open) return;

    if (hike) {
      form.reset({
        title: hike.title,
        slug: hike.slug,
        description: hike.description ?? "",
        startDate: dateInputValue(hike.startDate),
        endDate: dateInputValue(hike.endDate),
        type: hike.type,
        status: hike.status,
      });
    } else {
      form.reset(defaultHikeFormValues);
    }
  }, [form, hike, open]);

  const titleValue = useWatch({ control: form.control, name: "title" });

  const handleGenerateSlug = () => {
    const slug = createSlug(titleValue);

    if (slug) {
      form.setValue("slug", slug, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleSubmit = async (values: HikeFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset(defaultHikeFormValues);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save hike");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit hike" : "Create hike"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <HikeFormFields form={form} onGenerateSlug={handleGenerateSlug} />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save hike"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createGear, updateGear, type GearListItem } from "@/app/_data/gear";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
} from "@/components/index";
import { formatGearActivityTypeName } from "@/lib/gear";
import { cn } from "@/lib/utils";

// feature-121: the create and the edit dialog are one component. `gear` is
// null in create mode and the stored row in edit mode, which is what decides
// the title, the submit label, and the action the form calls.
//
// A gear item carries a set of activity types — the same shoes for running
// and for walking — so the types are toggled as chips instead of picked from
// a single-select. A type that was deactivated after it was attached is still
// shown, so the owner can see it and unlink it, but it cannot be added anew.

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(120, { message: "Name must be 120 characters or fewer" }),
  activityTypeIds: z.array(z.string()),
});

type GearFormValues = z.infer<typeof formSchema>;

const defaultValues: GearFormValues = {
  name: "",
  activityTypeIds: [],
};

type GearFormDialogProps = {
  gear: GearListItem | null;
  activityTypeOptions: { id: string; label: string }[];
  activeLanguage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const GearFormDialog = ({
  gear,
  activityTypeOptions,
  activeLanguage,
  open,
  onOpenChange,
}: GearFormDialogProps) => {
  const router = useRouter();
  const isEdit = Boolean(gear);
  const form = useForm<GearFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  const typeChoices = useMemo(() => {
    const choices = activityTypeOptions.map((option) => ({ ...option, isActive: true }));
    const known = new Set(choices.map((choice) => choice.id));

    for (const link of gear?.activityTypes ?? []) {
      if (known.has(link.activityTypeId)) continue;

      choices.push({
        id: link.activityTypeId,
        label: formatGearActivityTypeName(link.activityType, activeLanguage),
        isActive: false,
      });
    }

    return choices;
  }, [activityTypeOptions, gear, activeLanguage]);

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: gear?.name ?? "",
      activityTypeIds: gear?.activityTypes.map((link) => link.activityTypeId) ?? [],
    });

    // `reset` does not re-validate: it leaves the validity state of the
    // previous use of the form. On a record that is already valid that would
    // leave the submit button disabled, so the edit path refreshes it. The
    // create path is left alone — an empty name is genuinely invalid there,
    // and validating it on open would put the error on screen before the
    // owner has typed anything.
    if (gear) void form.trigger();
  }, [open, gear, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) form.reset(defaultValues);
  };

  const onSubmit = async (data: GearFormValues) => {
    const result =
      isEdit && gear
        ? await updateGear({ id: gear.id, name: data.name, activityTypeIds: data.activityTypeIds })
        : await createGear({ name: data.name, activityTypeIds: data.activityTypeIds });

    if (!result.ok) {
      toast.error(result.message);

      return;
    }

    toast.success(isEdit ? "Gear updated successfully" : "Gear created successfully");
    router.refresh();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby="gear-form-description">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit gear" : "Add gear"}</DialogTitle>
        </DialogHeader>
        <p id="gear-form-description" className="sr-only">
          {isEdit
            ? "Change the name or the activity types of this gear item."
            : "Add a gear item to your own inventory."}
        </p>

        <Form {...form}>
          <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Trail runners" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityTypeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity types</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {typeChoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No activity types are available yet — the item stays unclassified.
                        </p>
                      ) : (
                        typeChoices.map((choice) => {
                          const selected = field.value.includes(choice.id);

                          return (
                            <Badge key={choice.id} asChild variant={selected ? "default" : "outline"}>
                              <button
                                type="button"
                                aria-pressed={selected}
                                title={choice.isActive ? undefined : "This activity type is no longer active"}
                                onClick={() =>
                                  field.onChange(
                                    selected
                                      ? field.value.filter((id) => id !== choice.id)
                                      : [...field.value, choice.id],
                                  )
                                }
                                className={cn("cursor-pointer", !choice.isActive && "opacity-70")}
                              >
                                {choice.label}
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-fit cursor-pointer"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Spinner className="size-6" /> : isEdit ? "Save gear" : "Add gear"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

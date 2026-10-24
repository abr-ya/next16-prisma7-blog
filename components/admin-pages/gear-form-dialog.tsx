"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createGear, updateGear, type GearListItem } from "@/app/_data/gear";
import {
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@/components/index";

// feature-121: the create and the edit dialog are one component. `gear` is
// null in create mode and the stored row in edit mode, which is what decides
// the title, the submit label, and the action the form calls.
//
// Radix reserves the empty string as a select item value, so "not selected"
// is a sentinel rather than "".

const NO_ACTIVITY_TYPE = "none";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(120, { message: "Name must be 120 characters or fewer" }),
  activityTypeId: z.string(),
});

type GearFormValues = z.infer<typeof formSchema>;

const defaultValues: GearFormValues = {
  name: "",
  activityTypeId: NO_ACTIVITY_TYPE,
};

type GearFormDialogProps = {
  gear: GearListItem | null;
  activityTypeOptions: { id: string; label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const GearFormDialog = ({ gear, activityTypeOptions, open, onOpenChange }: GearFormDialogProps) => {
  const router = useRouter();
  const isEdit = Boolean(gear);
  const form = useForm<GearFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: gear?.name ?? "",
      activityTypeId: gear?.activityTypeId ?? NO_ACTIVITY_TYPE,
    });
  }, [open, gear, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) form.reset(defaultValues);
  };

  const onSubmit = async (data: GearFormValues) => {
    const activityTypeId = data.activityTypeId === NO_ACTIVITY_TYPE ? null : data.activityTypeId;
    const result =
      isEdit && gear
        ? await updateGear({ id: gear.id, name: data.name, activityTypeId })
        : await createGear({ name: data.name, activityTypeId });

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
            ? "Change the name or the activity type of this gear item."
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
              name="activityTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ACTIVITY_TYPE}>Not selected</SelectItem>
                      {activityTypeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

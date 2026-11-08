"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createRouteFromPoints, updateRoute, type RouteListItem } from "@/app/_data/routes";
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
  Spinner,
} from "@/components/index";
import { TrackEditor, type ManualTrackPoint } from "@/components/track-pages/track-editor";

// feature-128: one dialog for both metadata writes. In create mode it also
// carries the point editor — a route has no meaning without geometry — while
// edit mode only touches the title and the description. Geometry changes have
// their own dialog because they can reach every linked track and need a
// confirmation.

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Title is required" })
    .max(120, { message: "Title must be 120 characters or fewer" }),
  description: z.string().max(2000, { message: "Description must be 2000 characters or fewer" }).optional(),
});

type RouteFormValues = z.infer<typeof formSchema>;

type RouteFormDialogProps = {
  /** `null` creates a route; a stored row edits its title and description. */
  route: RouteListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * feature-141: a caller that creates a route as part of another flow (a
   * draft workout) needs the new route id to attach it immediately.
   */
  onCreated?: (routeId: string) => void;
};

export const RouteFormDialog = ({ route, open, onOpenChange, onCreated }: RouteFormDialogProps) => {
  const router = useRouter();
  const isEdit = Boolean(route);
  const [points, setPoints] = useState<ManualTrackPoint[]>([]);
  // The panel remounts this dialog per open (through `key`), so the initial
  // values are read once and never need a reset effect.
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: route?.title ?? "",
      description: route?.description ?? "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    // `useForm` starts with `isValid: false` even when the defaults are valid,
    // so the prefilled edit form would keep its submit disabled until the
    // owner typed. Validate once on mount for the edit path only — the create
    // path starts genuinely invalid.
    if (isEdit) void form.trigger();
  }, [isEdit, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };
  const onSubmit = async (values: RouteFormValues) => {
    const description = values.description?.trim() || null;

    if (isEdit && route) {
      const result = await updateRoute({ routeId: route.id, title: values.title, description });

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success("Route updated");
      router.refresh();
      handleOpenChange(false);

      return;
    }

    if (points.length < 2) {
      toast.error("Place at least two points on the map");

      return;
    }

    const result = await createRouteFromPoints({ title: values.title, description, points });

    if (!result.ok) {
      toast.error(result.message);

      return;
    }

    toast.success("Route created");
    onCreated?.(result.routeId);
    router.refresh();
    handleOpenChange(false);
  };

  const renderTextFields = () => (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Morning loop" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                placeholder="What this route is for, and where it goes."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const submitLabel = isEdit ? "Save route" : "Create route";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl"
        aria-describedby="route-form-description"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit route" : "New route"}</DialogTitle>
        </DialogHeader>
        <p id="route-form-description" className="sr-only">
          {isEdit
            ? "Change the title or the description of this route. Its geometry is edited separately."
            : "Create a route by placing at least two points on the map."}
        </p>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {isEdit ? (
              renderTextFields()
            ) : (
              <TrackEditor
                initialPoints={[]}
                onChangePoints={setPoints}
                renderFormFields={renderTextFields}
                mapAriaLabel="Route placement map"
              />
            )}

            <Button
              type="submit"
              className="w-fit cursor-pointer"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Spinner className="size-6" /> : submitLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFavoritePlace, updateFavoritePlace, type FavoritePlaceListItem } from "@/app/_data/favorite-places";
import { workspaceNamespace } from "@/app/i18n/settings";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
import { FavoritePlaceMap } from "@/components/places/favorite-place-map";

// feature-148: one dialog covers both the create and the rename path, the way
// the gear form does. A stored place is renamed only — its coordinate stays,
// because the coordinate is where the routes start, not a property the owner
// edits by accident while renaming.
//
// The coordinate is not a text field: it comes from one click on the map, or
// from dragging the marker, and it is held in the form so an empty map is
// refused with the same validation treatment as an empty name.

const formatCoordinate = (latitude: number, longitude: number) => `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

type FavoritePlaceFormValues = {
  name: string;
  latitude: number | null;
  longitude: number | null;
};

const emptyValues: FavoritePlaceFormValues = {
  name: "",
  latitude: null,
  longitude: null,
};

type FavoritePlaceFormDialogProps = {
  place: FavoritePlaceListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FavoritePlaceFormDialog = ({ place, open, onOpenChange }: FavoritePlaceFormDialogProps) => {
  const router = useRouter();
  const { t } = useT(workspaceNamespace);
  const isEdit = Boolean(place);

  const formSchema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(1, { message: t("places.nameRequired") })
            .max(120, { message: t("places.nameTooLong") }),
          latitude: z.number().nullable(),
          longitude: z.number().nullable(),
        })
        .refine((values) => values.latitude !== null && values.longitude !== null, {
          path: ["latitude"],
          message: t("places.coordinateRequired"),
        }),
    [t],
  );

  const form = useForm<FavoritePlaceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) return;

    form.reset(place ? { name: place.name, latitude: place.latitude, longitude: place.longitude } : emptyValues);
  }, [open, place, form]);

  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const hasCoordinate = latitude !== null && longitude !== null;

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) form.reset(emptyValues);
  };

  const onSubmit = async (data: FavoritePlaceFormValues) => {
    const result =
      isEdit && place
        ? await updateFavoritePlace({ id: place.id, name: data.name })
        : await createFavoritePlace({ name: data.name, latitude: data.latitude, longitude: data.longitude });

    if (!result.ok) {
      toast.error(result.message);

      return;
    }

    toast.success(isEdit ? t("places.updated") : t("places.created"));
    router.refresh();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("places.editTitle") : t("places.addTitle")}</DialogTitle>
          <DialogDescription>{isEdit ? t("places.editDescription") : t("places.addDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("places.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("places.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{t("places.coordinate")}</span>
                <span className="text-muted-foreground text-sm">
                  {hasCoordinate ? formatCoordinate(latitude, longitude) : t("places.coordinateNone")}
                </span>
              </div>
              <FavoritePlaceMap
                point={hasCoordinate ? { lat: latitude, lng: longitude } : null}
                onChangePoint={(point) => {
                  form.setValue("latitude", point.lat, { shouldDirty: true, shouldValidate: false });
                  form.setValue("longitude", point.lng, { shouldDirty: true, shouldValidate: false });
                  form.clearErrors(["latitude", "longitude"]);
                }}
                ariaLabel={t("places.mapLabel")}
              />
              <p className="text-muted-foreground text-sm">{t("places.mapHint")}</p>
              {/* The coordinate lives in the form, but the map renders no input
                  of its own, so the validation message is shown here. */}
              {form.formState.errors.latitude?.message ? (
                <p className="text-destructive text-sm">{form.formState.errors.latitude.message}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t("places.cancel")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner /> : null}
                {isEdit ? t("places.save") : t("places.create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

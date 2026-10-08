import { z } from "zod";

/**
 * Shared trip (hike) form schema, type, defaults, and date utilities consumed by both
 * the administrator create/edit panel and the public trip-creation dialog.
 *
 * Field set mirrors what the existing `createHike` / `updateHike` mutations accept.
 * Status remains selectable; the public surface still lets creators choose Draft vs
 * Published at creation time.
 */
export const hikeFormSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    slug: z.string().min(1, { message: "Slug is required" }),
    description: z.string().optional(),
    startDate: z.string().min(1, { message: "Start date is required" }),
    endDate: z.string().min(1, { message: "End date is required" }),
    type: z.enum(["HIKING", "MOUNTAIN", "WATER", "SKI", "BIKE", "OTHER"]),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .refine((values) => new Date(values.endDate) >= new Date(values.startDate), {
    message: "End date must be the same as or later than start date",
    path: ["endDate"],
  });

export type HikeFormValues = z.infer<typeof hikeFormSchema>;

export const defaultHikeFormValues: HikeFormValues = {
  title: "",
  slug: "",
  description: "",
  startDate: "",
  endDate: "",
  type: "HIKING",
  status: "DRAFT",
};

/** Format a Date / ISO string as a `<input type="date">` value (YYYY-MM-DD). */
export const dateInputValue = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

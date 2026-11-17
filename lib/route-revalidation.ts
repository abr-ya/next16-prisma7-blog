import { revalidatePath } from "next/cache";

/**
 * feature-152: the paths that read a route's shape.
 *
 * `/my/tracks` and `/my/workouts` carry the track dialog's route picker, so a
 * route rename, geometry change, rebuild, or deletion has to refresh them
 * too. Lives outside `app/_data/routes.ts` because that module is a
 * `"use server"` file: Next.js only allows async exports there, and the
 * composition rebuild needs the same synchronous helper.
 */
export const revalidateRoutePaths = () => {
  revalidatePath("/my/routes");
  revalidatePath("/my/tracks");
  revalidatePath("/my/workouts");
};

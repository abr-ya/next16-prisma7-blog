import { revalidatePath } from "next/cache";

/**
 * feature-128: the paths that read a track's geometry. A track resolves its
 * shape through its own GPX file or, for route-based tracks, through the
 * route it points at — so a route geometry edit must refresh exactly the same
 * surfaces a track edit does.
 *
 * Lives outside `app/_data/tracks.ts` because that module is a `"use server"`
 * file: Next.js only allows async exports there, and both the track actions
 * and the route actions need this synchronous helper.
 */
export const revalidateTrackPaths = () => {
  revalidatePath("/admin/tracks");
  revalidatePath("/my/tracks");
  revalidatePath("/my/workouts");
  revalidatePath("/admin/files");
  revalidatePath("/tracks");
  revalidatePath("/hikes");
};

"use server";

import { revalidatePath } from "next/cache";

import { hasAdminRole } from "@/lib/auth-roles";
import { AuthorizationError, requireActionUser, requireAdmin } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const markFileAssetPendingDelete = async (fileId: string) => {
  await requireAdmin();

  const result = await prisma.fileAsset.updateMany({
    where: {
      id: fileId,
      status: "ACTIVE",
    },
    data: {
      status: "PENDING_DELETE",
      deletedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: "File is no longer active.",
    };
  }

  revalidatePath("/admin/files");

  return {
    success: true,
    message: "File marked pending delete.",
  };
};

/** Machine-readable reason a track GPX discard was rejected. */
export type DiscardTrackGpxErrorCode = "NOT_SAFE" | "NOT_OWNER";

type DiscardTrackGpxResult =
  | { success: true; message: string }
  | { success: false; message: string; code: DiscardTrackGpxErrorCode };

export const markDiscardedTrackGpxFileAssetsPendingDelete = async (
  fileIds: string[],
): Promise<DiscardTrackGpxResult> => {
  const actor = await requireActionUser();

  const uniqueFileIds = Array.from(new Set(fileIds.map((fileId) => fileId.trim()).filter(Boolean)));

  if (uniqueFileIds.length === 0) {
    return {
      success: true,
      message: "No uploaded GPX files to discard.",
    };
  }

  // Resolve the actor's admin status once so the ownership filter below can
  // short-circuit for the admin path.
  const actorRecord = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { role: true },
  });
  const isAdmin = hasAdminRole(actorRecord?.role);

  const safeFiles = await prisma.fileAsset.findMany({
    where: {
      id: {
        in: uniqueFileIds,
      },
      status: "ACTIVE",
      purpose: "TRACK_GPX",
      track: null,
      // Non-admin actors can only discard uploads they own. Administrators
      // can discard any qualifying file from the admin workspace.
      ...(isAdmin ? {} : { ownerUserId: actor.id }),
    },
    select: {
      id: true,
    },
  });
  const safeFileIds = new Set(safeFiles.map((file: { id: string }) => file.id));
  const unsafeFileId = uniqueFileIds.find((fileId) => !safeFileIds.has(fileId));

  if (unsafeFileId) {
    return {
      success: false,
      message: isAdmin
        ? "An uploaded GPX file is no longer safe to discard."
        : "You can only discard GPX files you uploaded.",
      code: isAdmin ? "NOT_SAFE" : "NOT_OWNER",
    };
  }

  await prisma.fileAsset.updateMany({
    where: {
      id: {
        in: uniqueFileIds,
      },
      status: "ACTIVE",
      purpose: "TRACK_GPX",
      track: null,
      ...(isAdmin ? {} : { ownerUserId: actor.id }),
    },
    data: {
      status: "PENDING_DELETE",
      deletedAt: new Date(),
    },
  });

  revalidatePath("/admin/files");
  revalidatePath("/admin/tracks");
  revalidatePath("/my/tracks");

  return {
    success: true,
    message: "Uploaded GPX file discarded.",
  };
};

/** Machine-readable reason a file rename was rejected. */
export type RenameTrackFileErrorCode = "NOT_FOUND" | "NOT_RENAMABLE" | "VALIDATION" | "UNAUTHORIZED" | "INTERNAL";

export type RenameTrackFileResult =
  | { ok: true; name: string }
  | { ok: false; code: RenameTrackFileErrorCode; message: string };

const TRACK_FILE_NAME_SUFFIX = ".gpx";

/**
 * feature-147: a name is a label, not a path. Path separators and control
 * characters are dropped, and the fixed `.gpx` suffix is removed when the
 * owner typed it in — the server adds the suffix back, exactly once.
 *
 * Module-private: a `"use server"` file may only export async functions.
 */
const normalizeTrackFileBaseName = (value: string) => {
  const stripped = Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      const isControlCharacter = code < 0x20 || code === 0x7f;

      return !isControlCharacter && character !== "/" && character !== "\\";
    })
    .join("")
    .trim();

  return stripped.toLowerCase().endsWith(TRACK_FILE_NAME_SUFFIX)
    ? stripped.slice(0, -TRACK_FILE_NAME_SUFFIX.length).trim()
    : stripped;
};

/**
 * feature-147: the owner renames the GPX file of their own workout. Only the
 * stored display name changes — the provider object, its key, and the URL
 * stay as they are, so the download URL keeps working while the name it
 * serves follows the rename.
 */
export const renameTrackFileAsset = async ({
  trackId,
  name,
}: {
  trackId: string;
  name: string;
}): Promise<RenameTrackFileResult> => {
  const normalizedTrackId = trackId?.trim() ?? "";

  if (!normalizedTrackId) {
    return { ok: false, code: "NOT_FOUND", message: "Track not found" };
  }

  try {
    const actor = await requireActionUser();
    const track = await prisma.track.findFirst({
      // The track must belong to the signed-in owner: a track of another
      // owner is reported as missing, so the action never confirms that it
      // exists.
      where: { id: normalizedTrackId, userId: actor.id },
      select: {
        id: true,
        slug: true,
        routeId: true,
        fileAsset: { select: { id: true, purpose: true, status: true } },
      },
    });

    if (!track) {
      return { ok: false, code: "NOT_FOUND", message: "Track not found" };
    }

    // A workout built on a route borrows the route's file, which the route
    // library and every other workout on that route also use — renaming it
    // from one workout page would change it for all of them.
    if (
      track.routeId ||
      !track.fileAsset ||
      track.fileAsset.purpose !== "TRACK_GPX" ||
      track.fileAsset.status !== "ACTIVE"
    ) {
      return {
        ok: false,
        code: "NOT_RENAMABLE",
        message: "This workout does not own a GPX file that can be renamed",
      };
    }

    const baseName = normalizeTrackFileBaseName(name ?? "");

    if (!baseName) {
      return { ok: false, code: "VALIDATION", message: "Enter a file name" };
    }

    const nextName = `${baseName}${TRACK_FILE_NAME_SUFFIX}`;
    const updated = await prisma.fileAsset.updateMany({
      where: { id: track.fileAsset.id, status: "ACTIVE" },
      data: { name: nextName },
    });

    if (updated.count === 0) {
      return { ok: false, code: "NOT_RENAMABLE", message: "This file is no longer active" };
    }

    // The name shows on the track page, on the public track list, and in the
    // administrator's file list.
    revalidatePath(`/tracks/${track.slug}`);
    revalidatePath("/tracks");
    revalidatePath("/admin/files");

    return { ok: true, name: nextName };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not rename the file",
    };
  }
};

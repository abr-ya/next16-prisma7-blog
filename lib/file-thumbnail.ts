import type { FileAssetPurpose, FileAssetStatus } from "@/generated/prisma/enums";

/**
 * The file-asset fields the app-owned thumbnail route inspects before it
 * serves an image.
 */
export type ThumbnailFileAsset = {
  status: FileAssetStatus;
  mimeType: string;
  purpose: FileAssetPurpose;
};

/**
 * Whether the app-owned thumbnail route can serve this file asset as an
 * image thumbnail. The route enforces the same rule, so a preview built
 * from this predicate never points at a URL the route would refuse.
 */
export const isThumbnailEligibleFileAsset = (fileAsset: ThumbnailFileAsset) =>
  fileAsset.status === "ACTIVE" &&
  fileAsset.mimeType.startsWith("image/") &&
  fileAsset.purpose === "OUTDOOR_PHOTO_IMAGE";

/** The app-owned compact thumbnail URL for a file asset. */
export const getFileThumbnailUrl = (fileAssetId: string) => `/files/${fileAssetId}/thumbnail`;

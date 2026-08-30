import type { PhotoStatus } from "@/generated/prisma/enums";

export const PHOTO_IMAGE_MIN_COUNT = 1;
export const PHOTO_IMAGE_MAX_COUNT = 3;

export type PhotoInputValues = {
  title: string;
  description?: string | null;
  status?: PhotoStatus;
  fileAssetIds?: string[] | null;
};

export type NormalizedPhotoInput = {
  title: string;
  description: string | null;
  status: PhotoStatus;
  fileAssetIds: string[];
};

export const photoStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
] as const satisfies { value: PhotoStatus; label: string }[];

const PHOTO_STATUSES = new Set<PhotoStatus>(["DRAFT", "PUBLISHED"]);

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
};

const normalizeOptionalText = (value?: string | null) => {
  const normalized = value?.trim();

  return normalized ? normalized : null;
};

const normalizeFileAssetIds = (fileAssetIds?: string[] | null) => {
  const normalizedIds = (fileAssetIds ?? []).map((id) => id.trim()).filter(Boolean);
  const uniqueIds = new Set(normalizedIds);

  if (normalizedIds.length !== uniqueIds.size) {
    throw new Error("Photo images must be unique");
  }

  if (normalizedIds.length < PHOTO_IMAGE_MIN_COUNT) {
    throw new Error("At least one photo image is required");
  }

  if (normalizedIds.length > PHOTO_IMAGE_MAX_COUNT) {
    throw new Error(`Photos can use at most ${PHOTO_IMAGE_MAX_COUNT} images`);
  }

  return normalizedIds;
};

export const normalizePhotoInput = ({
  title,
  description,
  status = "DRAFT",
  fileAssetIds,
}: PhotoInputValues): NormalizedPhotoInput => {
  if (!PHOTO_STATUSES.has(status)) {
    throw new Error("Photo status is invalid");
  }

  return {
    title: normalizeRequiredText(title, "Title"),
    description: normalizeOptionalText(description),
    status,
    fileAssetIds: normalizeFileAssetIds(fileAssetIds),
  };
};

export const formatPhotoStatus = (status: PhotoStatus) =>
  photoStatusOptions.find((option) => option.value === status)?.label ?? status;

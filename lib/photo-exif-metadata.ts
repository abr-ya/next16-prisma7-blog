import type { Prisma } from "@/generated/prisma/client";

export const PHOTO_EXIF_METADATA_VERSION = "photo-exif-metadata/v1";

export type PhotoExifParseStatus = "SUCCESS" | "FAILED" | "STALE";

export type PhotoExifGps = {
  lat: number;
  lng: number;
};

export type PhotoExifSourceImage = {
  fileAssetId: string;
  fileKey: string;
  sortOrder: number;
};

export type PhotoExifImageSummary = {
  fileAssetId: string;
  fileKey: string;
  sortOrder: number;
  capturedAt: string | null;
  width: number | null;
  height: number | null;
  orientation: number | null;
  make: string | null;
  model: string | null;
  lens: string | null;
  gps: PhotoExifGps | null;
};

export type PhotoExifSummary = {
  capturedAt: string | null;
  width: number | null;
  height: number | null;
  orientation: number | null;
  make: string | null;
  model: string | null;
  lens: string | null;
  cameraLabel: string | null;
  gps: PhotoExifGps | null;
  gpsSourceFileAssetId: string | null;
};

export type PhotoExifSafeRaw = Record<string, string | number | boolean | null>;

export type PhotoExifMetadata = {
  exifParse: {
    status: PhotoExifParseStatus;
    version: typeof PHOTO_EXIF_METADATA_VERSION;
    parsedAt: string;
    sourceImages: PhotoExifSourceImage[];
    errorMessage?: string;
  };
  summary: PhotoExifSummary | null;
  images: PhotoExifImageSummary[] | null;
  raw: PhotoExifSafeRaw | null;
};

export type PhotoExifMetadataState =
  | { status: "MISSING"; metadata: null }
  | { status: "SUCCESS"; metadata: PhotoExifMetadata; summary: PhotoExifSummary }
  | { status: "FAILED"; metadata: PhotoExifMetadata; errorMessage: string }
  | { status: "STALE"; metadata: PhotoExifMetadata; errorMessage: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const isIsoDateString = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isGps = (value: unknown): value is PhotoExifGps =>
  isRecord(value) && isFiniteNumber(value.lat) && isFiniteNumber(value.lng) && isValidGps(value.lat, value.lng);

export const isValidGps = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const isNullableString = (value: unknown): value is string | null => value === null || typeof value === "string";

const isNullableFiniteNumber = (value: unknown): value is number | null => value === null || isFiniteNumber(value);

const isSourceImage = (value: unknown): value is PhotoExifSourceImage =>
  isRecord(value) &&
  typeof value.fileAssetId === "string" &&
  typeof value.fileKey === "string" &&
  isFiniteNumber(value.sortOrder);

const isImageSummary = (value: unknown): value is PhotoExifImageSummary =>
  isRecord(value) &&
  typeof value.fileAssetId === "string" &&
  typeof value.fileKey === "string" &&
  isFiniteNumber(value.sortOrder) &&
  isNullableString(value.capturedAt) &&
  (value.capturedAt === null || isIsoDateString(value.capturedAt)) &&
  isNullableFiniteNumber(value.width) &&
  isNullableFiniteNumber(value.height) &&
  isNullableFiniteNumber(value.orientation) &&
  isNullableString(value.make) &&
  isNullableString(value.model) &&
  isNullableString(value.lens) &&
  (value.gps === null || isGps(value.gps));

const isSummary = (value: unknown): value is PhotoExifSummary =>
  isRecord(value) &&
  isNullableString(value.capturedAt) &&
  (value.capturedAt === null || isIsoDateString(value.capturedAt)) &&
  isNullableFiniteNumber(value.width) &&
  isNullableFiniteNumber(value.height) &&
  isNullableFiniteNumber(value.orientation) &&
  isNullableString(value.make) &&
  isNullableString(value.model) &&
  isNullableString(value.lens) &&
  isNullableString(value.cameraLabel) &&
  (value.gps === null || isGps(value.gps)) &&
  isNullableString(value.gpsSourceFileAssetId);

const isSafeRaw = (value: unknown): value is PhotoExifSafeRaw => {
  if (!isRecord(value)) return false;

  return Object.values(value).every(
    (entry) => entry === null || typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean",
  );
};

const sourceImagesFingerprint = (images: PhotoExifSourceImage[]) =>
  images
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => `${image.sortOrder}:${image.fileAssetId}:${image.fileKey}`)
    .join("|");

export const buildPhotoExifCameraLabel = (make?: string | null, model?: string | null) => {
  const normalizedMake = make?.trim() || null;
  const normalizedModel = model?.trim() || null;

  if (normalizedMake && normalizedModel) {
    if (normalizedModel.toLowerCase().startsWith(normalizedMake.toLowerCase())) {
      return normalizedModel;
    }

    return `${normalizedMake} ${normalizedModel}`;
  }

  return normalizedModel ?? normalizedMake;
};

export const readPhotoExifMetadata = (value: Prisma.JsonValue | null | undefined): PhotoExifMetadata | null => {
  if (!isRecord(value)) return null;

  const exifParse = value.exifParse;
  if (!isRecord(exifParse)) return null;

  const status = exifParse.status;
  if (status !== "SUCCESS" && status !== "FAILED" && status !== "STALE") return null;

  if (
    exifParse.version !== PHOTO_EXIF_METADATA_VERSION ||
    !isIsoDateString(exifParse.parsedAt) ||
    !Array.isArray(exifParse.sourceImages) ||
    !exifParse.sourceImages.every(isSourceImage)
  ) {
    return null;
  }

  const errorMessage = typeof exifParse.errorMessage === "string" ? exifParse.errorMessage : undefined;
  const summary = value.summary === null ? null : isSummary(value.summary) ? value.summary : null;
  const images =
    value.images === null
      ? null
      : Array.isArray(value.images) && value.images.every(isImageSummary)
        ? value.images
        : null;
  const raw = value.raw === null ? null : isSafeRaw(value.raw) ? value.raw : null;

  return {
    exifParse: {
      status,
      version: PHOTO_EXIF_METADATA_VERSION,
      parsedAt: exifParse.parsedAt,
      sourceImages: exifParse.sourceImages.map((image) => ({
        fileAssetId: image.fileAssetId,
        fileKey: image.fileKey,
        sortOrder: image.sortOrder,
      })),
      ...(errorMessage ? { errorMessage } : {}),
    },
    summary,
    images,
    raw,
  };
};

export const getPhotoExifMetadataState = (
  value: Prisma.JsonValue | null | undefined,
  sourceImages?: PhotoExifSourceImage[],
): PhotoExifMetadataState => {
  const metadata = readPhotoExifMetadata(value);

  if (!metadata) return { status: "MISSING", metadata: null };

  const sourceChanged =
    sourceImages && sourceImagesFingerprint(metadata.exifParse.sourceImages) !== sourceImagesFingerprint(sourceImages);

  if (sourceChanged || metadata.exifParse.status === "STALE") {
    return { status: "STALE", metadata, errorMessage: metadata.exifParse.errorMessage ?? null };
  }

  if (metadata.exifParse.status === "FAILED") {
    return {
      status: "FAILED",
      metadata,
      errorMessage: metadata.exifParse.errorMessage ?? "Photo metadata extraction failed",
    };
  }

  if (metadata.summary) {
    return { status: "SUCCESS", metadata, summary: metadata.summary };
  }

  return { status: "STALE", metadata, errorMessage: "Parsed photo metadata is incomplete" };
};

export const createSuccessfulPhotoExifMetadata = ({
  parsedAt = new Date(),
  sourceImages,
  summary,
  images,
  raw = null,
}: {
  parsedAt?: Date;
  sourceImages: PhotoExifSourceImage[];
  summary: PhotoExifSummary;
  images: PhotoExifImageSummary[];
  raw?: PhotoExifSafeRaw | null;
}): PhotoExifMetadata => ({
  exifParse: {
    status: "SUCCESS",
    version: PHOTO_EXIF_METADATA_VERSION,
    parsedAt: parsedAt.toISOString(),
    sourceImages,
  },
  summary,
  images,
  raw,
});

export const createFailedPhotoExifMetadata = ({
  parsedAt = new Date(),
  sourceImages,
  errorMessage,
}: {
  parsedAt?: Date;
  sourceImages: PhotoExifSourceImage[];
  errorMessage: string;
}): PhotoExifMetadata => ({
  exifParse: {
    status: "FAILED",
    version: PHOTO_EXIF_METADATA_VERSION,
    parsedAt: parsedAt.toISOString(),
    sourceImages,
    errorMessage,
  },
  summary: null,
  images: null,
  raw: null,
});

export const markPhotoExifMetadataStale = (
  value: Prisma.JsonValue | null | undefined,
  sourceImages: PhotoExifSourceImage[],
): PhotoExifMetadata | null => {
  const metadata = readPhotoExifMetadata(value);

  if (!metadata) return null;

  if (sourceImagesFingerprint(metadata.exifParse.sourceImages) === sourceImagesFingerprint(sourceImages)) {
    return null;
  }

  return {
    ...metadata,
    exifParse: {
      ...metadata.exifParse,
      status: "STALE",
      parsedAt: new Date().toISOString(),
      sourceImages,
      errorMessage: "Photo images were changed. Refresh metadata to update EXIF and GPS data.",
    },
    summary: null,
    images: null,
    raw: null,
  };
};

const dateTimeFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatPhotoCapturedAt = (value?: string | null) => {
  if (!value || Number.isNaN(Date.parse(value))) return null;

  return dateTimeFormat.format(new Date(value));
};

export const formatPhotoDimensions = (width?: number | null, height?: number | null) => {
  if (!isFiniteNumber(width) || !isFiniteNumber(height)) return null;

  return `${Math.round(width)}×${Math.round(height)}`;
};

export const formatPhotoGpsPresence = (gps?: PhotoExifGps | null) => (gps ? "GPS yes" : "GPS no");

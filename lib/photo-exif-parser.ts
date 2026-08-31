import exifr from "exifr";

import {
  buildPhotoExifCameraLabel,
  createFailedPhotoExifMetadata,
  createSuccessfulPhotoExifMetadata,
  isValidGps,
  type PhotoExifGps,
  type PhotoExifImageSummary,
  type PhotoExifMetadata,
  type PhotoExifSafeRaw,
  type PhotoExifSourceImage,
  type PhotoExifSummary,
} from "@/lib/photo-exif-metadata";

export type PhotoExifParseImageInput = PhotoExifSourceImage & {
  url: string;
};

type ParsedImageExif = {
  image: PhotoExifImageSummary;
  raw: PhotoExifSafeRaw;
};

const SAFE_RAW_KEYS = [
  "Make",
  "Model",
  "LensModel",
  "Lens",
  "Software",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "Orientation",
  "ExifImageWidth",
  "ExifImageHeight",
  "ImageWidth",
  "ImageHeight",
  "ISO",
  "FNumber",
  "ExposureTime",
  "FocalLength",
] as const;

const sanitizeErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Photo metadata extraction failed";

  if (
    message === "Unable to read photo image from storage" ||
    message === "Photo has no image files to parse" ||
    message === "Photo metadata extraction failed"
  ) {
    return message;
  }

  return "Photo metadata extraction failed";
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();

  return normalized ? normalized : null;
};

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);

  return null;
};

const toCapturedAt = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
};

const toGps = (latitude: unknown, longitude: unknown): PhotoExifGps | null => {
  const lat = toNullableNumber(latitude);
  const lng = toNullableNumber(longitude);

  if (lat === null || lng === null || !isValidGps(lat, lng)) return null;

  return { lat, lng };
};

const toSafeRaw = (parsed: Record<string, unknown> | null | undefined): PhotoExifSafeRaw => {
  if (!parsed) return {};

  const raw: PhotoExifSafeRaw = {};

  for (const key of SAFE_RAW_KEYS) {
    const value = parsed[key];

    if (value === null || value === undefined) continue;

    if (value instanceof Date) {
      raw[key] = value.toISOString();
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      raw[key] = value;
    }
  }

  return raw;
};

const fetchPhotoImageBytes = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to read photo image from storage");
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    throw new Error("Unable to read photo image from storage");
  }
};

const parseOneImage = async (input: PhotoExifParseImageInput): Promise<ParsedImageExif> => {
  const bytes = await fetchPhotoImageBytes(input.url);
  const parsed = (await exifr.parse(bytes, {
    gps: true,
    reviveValues: true,
    pick: [...SAFE_RAW_KEYS, "latitude", "longitude"],
  })) as Record<string, unknown> | undefined;

  const make = toNullableString(parsed?.Make);
  const model = toNullableString(parsed?.Model);
  const lens = toNullableString(parsed?.LensModel) ?? toNullableString(parsed?.Lens);
  const width = toNullableNumber(parsed?.ExifImageWidth) ?? toNullableNumber(parsed?.ImageWidth);
  const height = toNullableNumber(parsed?.ExifImageHeight) ?? toNullableNumber(parsed?.ImageHeight);
  const orientation = toNullableNumber(parsed?.Orientation);
  const capturedAt = toCapturedAt(parsed?.DateTimeOriginal) ?? toCapturedAt(parsed?.CreateDate);
  const gps = toGps(parsed?.latitude, parsed?.longitude);

  return {
    image: {
      fileAssetId: input.fileAssetId,
      fileKey: input.fileKey,
      sortOrder: input.sortOrder,
      capturedAt,
      width,
      height,
      orientation,
      make,
      model,
      lens,
      gps,
    },
    raw: toSafeRaw(parsed),
  };
};

const buildSummary = (images: PhotoExifImageSummary[]): PhotoExifSummary => {
  const primary = images[0];
  const gpsImage = images.find((image) => image.gps);

  return {
    capturedAt: images.find((image) => image.capturedAt)?.capturedAt ?? null,
    width: primary?.width ?? null,
    height: primary?.height ?? null,
    orientation: primary?.orientation ?? null,
    make: primary?.make ?? null,
    model: primary?.model ?? null,
    lens: primary?.lens ?? null,
    cameraLabel: buildPhotoExifCameraLabel(primary?.make, primary?.model) ?? null,
    gps: gpsImage?.gps ?? null,
    gpsSourceFileAssetId: gpsImage?.fileAssetId ?? null,
  };
};

export const parsePhotoExifMetadata = async ({
  images,
}: {
  images: PhotoExifParseImageInput[];
}): Promise<PhotoExifMetadata> => {
  const sourceImages: PhotoExifSourceImage[] = images.map(({ fileAssetId, fileKey, sortOrder }) => ({
    fileAssetId,
    fileKey,
    sortOrder,
  }));

  try {
    if (images.length === 0) {
      throw new Error("Photo has no image files to parse");
    }

    const orderedImages = images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const parsedImages: ParsedImageExif[] = [];

    for (const image of orderedImages) {
      parsedImages.push(await parseOneImage(image));
    }

    const imageSummaries = parsedImages.map((entry) => entry.image);
    const primaryRaw = parsedImages[0]?.raw ?? {};

    return createSuccessfulPhotoExifMetadata({
      sourceImages,
      summary: buildSummary(imageSummaries),
      images: imageSummaries,
      raw: primaryRaw,
    });
  } catch (error) {
    return createFailedPhotoExifMetadata({
      sourceImages,
      errorMessage: sanitizeErrorMessage(error),
    });
  }
};

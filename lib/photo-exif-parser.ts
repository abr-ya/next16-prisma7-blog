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
  "OffsetTimeOriginal",
  "OffsetTimeDigitized",
  "OffsetTime",
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

const EXIF_OFFSET_PATTERN = /^([+-])(\d{2}):?(\d{2})$/;
const EXIF_DATE_TIME_PATTERN = /^(\d{4})[:-]?(\d{2})[:-]?(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;

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

const parseExifOffsetMinutes = (value: unknown): number | null => {
  if (typeof value !== "string") return null;

  const match = value.trim().match(EXIF_OFFSET_PATTERN);

  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes > 59) return null;

  return sign * (hours * 60 + minutes);
};

const parseExifDateTimeParts = (value: string) => {
  const match = value.trim().match(EXIF_DATE_TIME_PATTERN);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);

  if (![year, month, day, hours, minutes, seconds].every((part) => Number.isFinite(part))) return null;

  return { year, month, day, hours, minutes, seconds };
};

// EXIF DateTime* is a wall-clock value. When OffsetTime* is present, convert with that offset
// instead of letting exifr/Date treat the wall clock as the Node process timezone (which adds a
// second shift — e.g. +03 display — on top of an already-offset photo).
const toCapturedAt = (value: unknown, offsetValue?: unknown): string | null => {
  if (typeof value === "string") {
    const parts = parseExifDateTimeParts(value);

    if (parts) {
      const offsetMinutes = parseExifOffsetMinutes(offsetValue);
      const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, parts.seconds);

      if (offsetMinutes !== null) {
        return new Date(utcMillis - offsetMinutes * 60_000).toISOString();
      }

      // No OffsetTime*: keep prior ambiguous behavior (interpret as process-local wall time).
      const local = new Date(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, parts.seconds);

      return Number.isNaN(local.getTime()) ? null : local.toISOString();
    }

    if (!Number.isNaN(Date.parse(value))) {
      return new Date(value).toISOString();
    }

    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
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
    // Keep date tags as raw EXIF strings so OffsetTime* can be applied explicitly.
    reviveValues: false,
    pick: [...SAFE_RAW_KEYS, "latitude", "longitude"],
  })) as Record<string, unknown> | undefined;

  const make = toNullableString(parsed?.Make);
  const model = toNullableString(parsed?.Model);
  const lens = toNullableString(parsed?.LensModel) ?? toNullableString(parsed?.Lens);
  const width = toNullableNumber(parsed?.ExifImageWidth) ?? toNullableNumber(parsed?.ImageWidth);
  const height = toNullableNumber(parsed?.ExifImageHeight) ?? toNullableNumber(parsed?.ImageHeight);
  const orientation = toNullableNumber(parsed?.Orientation);
  const originalOffset = parsed?.OffsetTimeOriginal ?? parsed?.OffsetTime;
  const digitizedOffset = parsed?.OffsetTimeDigitized ?? parsed?.OffsetTime;
  const capturedAt =
    toCapturedAt(parsed?.DateTimeOriginal, originalOffset) ?? toCapturedAt(parsed?.CreateDate, digitizedOffset);
  const exposureTime = toNullableNumber(parsed?.ExposureTime);
  const fNumber = toNullableNumber(parsed?.FNumber);
  const focalLength = toNullableNumber(parsed?.FocalLength);
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
      exposureTime,
      fNumber,
      focalLength,
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
    exposureTime: primary?.exposureTime ?? null,
    fNumber: primary?.fNumber ?? null,
    focalLength: primary?.focalLength ?? null,
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

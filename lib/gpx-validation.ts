const GPX_FILE_EXTENSION_PATTERN = /\.gpx$/i;
const ALLOWED_GPX_MIME_TYPES = new Set(["application/gpx+xml", "application/xml", "text/xml", ""]);
const GPX_SNIFF_MAX_CHARS = 4096;
const GPX_ROOT_PATTERN = /<\s*(?:[\w-]+:)?gpx(?:\s|>)/i;
const TRACK_POINT_PATTERN = /<\s*(?:[\w-]+:)?trkpt\b[^>]*\/?>/gi;
const TRACK_POINT_FULL_PATTERN = /<\s*(?:[\w-]+:)?trkpt\b([^>/]*)(?:\/>|>([\s\S]*?)<\s*\/\s*(?:[\w-]+:)?trkpt\s*>)/gi;
const LATITUDE_ATTRIBUTE_PATTERN = /\blat\s*=\s*["']([^"']+)["']/i;
const LONGITUDE_ATTRIBUTE_PATTERN = /\blon\s*=\s*["']([^"']+)["']/i;

export const hasGpxFilename = (filename: string) => GPX_FILE_EXTENSION_PATTERN.test(filename.trim());

export const hasAllowedGpxMimeType = (mimeType?: string | null) =>
  ALLOWED_GPX_MIME_TYPES.has((mimeType ?? "").trim().toLowerCase());

export const validateGpxUploadMetadata = ({ name, type }: { name: string; type?: string | null }) => {
  if (!hasGpxFilename(name)) {
    throw new Error("GPX file must use a .gpx filename");
  }

  if (!hasAllowedGpxMimeType(type)) {
    throw new Error("GPX file MIME type is not supported");
  }
};

export const looksLikeGpxContent = (content: string) => {
  const sample = content.slice(0, GPX_SNIFF_MAX_CHARS).trimStart();
  const withoutXmlDeclaration = sample.replace(/^<\?xml[\s\S]*?\?>\s*/i, "");

  return GPX_ROOT_PATTERN.test(withoutXmlDeclaration);
};

export const validateGpxContent = (content: string) => {
  if (!looksLikeGpxContent(content)) {
    throw new Error("GPX file content does not look like GPX XML");
  }
};

export type GpxValidationResult =
  | { ok: true; pointCount: number }
  | { ok: false; reason: "no-gpx-root" | "no-track-points" | "invalid-coordinates" };

const isFiniteCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

/**
 * String-level GPX validator used by `createManualTrack` to confirm a
 * server-built synthetic GPX byte string is well-formed before the upload.
 * Mirrors the structural checks the existing `validateGpxContent` byte-level
 * sniff performs (root `<gpx>` element + at least one `<trkpt>`) and
 * additionally requires the coordinates to be parseable and within WGS84
 * bounds. Returns a structured result instead of throwing so the caller
 * can map the failure into the right `CreateManualTrackResult` `code`.
 */
export const validateGpxString = (content: string): GpxValidationResult => {
  if (!GPX_ROOT_PATTERN.test(content)) {
    return { ok: false, reason: "no-gpx-root" };
  }

  let usablePointCount = 0;

  for (const match of content.matchAll(TRACK_POINT_FULL_PATTERN)) {
    const latMatch = match[1].match(LATITUDE_ATTRIBUTE_PATTERN);
    const lngMatch = match[1].match(LONGITUDE_ATTRIBUTE_PATTERN);
    if (!latMatch || !lngMatch) continue;
    const lat = Number(latMatch[1]);
    const lng = Number(lngMatch[1]);
    if (isFiniteCoordinate(lat, lng)) {
      usablePointCount += 1;
    }
  }

  if (usablePointCount === 0) {
    // Distinguish "no points at all" from "points but all invalid" — the
    // latter is an authoring bug we want to surface distinctly.
    if (TRACK_POINT_PATTERN.test(content)) {
      return { ok: false, reason: "invalid-coordinates" };
    }
    return { ok: false, reason: "no-track-points" };
  }

  return { ok: true, pointCount: usablePointCount };
};

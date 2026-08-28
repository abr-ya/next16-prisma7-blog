const GPX_FILE_EXTENSION_PATTERN = /\.gpx$/i;
const ALLOWED_GPX_MIME_TYPES = new Set(["application/gpx+xml", "application/xml", "text/xml", ""]);
const GPX_SNIFF_MAX_CHARS = 4096;

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

  return /^<gpx(?:\s|>)/i.test(withoutXmlDeclaration);
};

export const validateGpxContent = (content: string) => {
  if (!looksLikeGpxContent(content)) {
    throw new Error("GPX file content does not look like GPX XML");
  }
};

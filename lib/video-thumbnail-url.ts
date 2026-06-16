const SUPPORTED_THUMBNAIL_HOSTNAMES = new Set(["i.ytimg.com", "utfs.io", "lh3.googleusercontent.com"]);

export const normalizeVideoThumbnailUrl = (value?: string | null) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) return null;

  const url = new URL(normalizedValue);

  if (url.protocol !== "https:") {
    throw new Error("Thumbnail URL must use HTTPS");
  }

  if (!SUPPORTED_THUMBNAIL_HOSTNAMES.has(url.hostname.toLowerCase())) {
    throw new Error("Unsupported thumbnail URL host");
  }

  return url.toString();
};

export const isSupportedVideoThumbnailUrl = (value?: string | null) => {
  try {
    return Boolean(normalizeVideoThumbnailUrl(value));
  } catch {
    return false;
  }
};

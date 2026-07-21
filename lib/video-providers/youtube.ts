import { emptyVideoProviderMetadata, type VideoProviderMetadata } from "./metadata";

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const normalizeHostname = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");

const isSupportedYouTubeHostname = (hostname: string) => {
  const normalizedHostname = normalizeHostname(hostname);

  return (
    normalizedHostname === "youtube.com" || normalizedHostname === "m.youtube.com" || normalizedHostname === "youtu.be"
  );
};

const normalizeVideoId = (value: string | null | undefined) => {
  if (!value) return null;

  const [videoId] = value.split(/[?&#/]/);

  if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) return null;

  return videoId;
};

export const getYouTubeVideoId = (value: string) => {
  try {
    const url = new URL(value);
    const hostname = normalizeHostname(url.hostname);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (!isSupportedYouTubeHostname(url.hostname)) return null;

    if (hostname === "youtu.be") {
      return normalizeVideoId(pathParts[0]);
    }

    if (url.pathname === "/watch") {
      return normalizeVideoId(url.searchParams.get("v"));
    }

    if (["shorts", "embed"].includes(pathParts[0])) {
      return normalizeVideoId(pathParts[1]);
    }

    return null;
  } catch {
    return null;
  }
};

export const getYouTubeThumbnailUrl = (value: string) => {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) return null;

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
};

export const getYouTubeEmbedUrl = (value: string) => {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}`;
};

export const extractYouTubeMetadata = (value: string): VideoProviderMetadata => {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) return emptyVideoProviderMetadata();

  return {
    provider: "youtube",
    providerVideoId: videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    durationSeconds: null,
  };
};

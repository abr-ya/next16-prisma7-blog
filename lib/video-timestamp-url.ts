const YOUTUBE_HOSTNAMES = new Set(["youtube.com", "m.youtube.com", "youtu.be"]);

const normalizeHostname = (hostname: string) => hostname.toLowerCase().replace(/^www\./, "");

export const getVideoTimestampUrl = (videoUrl: string, timestampSeconds: number) => {
  if (!Number.isInteger(timestampSeconds) || timestampSeconds < 0) return null;

  try {
    const url = new URL(videoUrl);
    const hostname = normalizeHostname(url.hostname);

    if (!YOUTUBE_HOSTNAMES.has(hostname)) return null;

    url.hash = "";
    url.searchParams.set("t", `${timestampSeconds}s`);

    return url.toString();
  } catch {
    return null;
  }
};

export const formatVideoTimestamp = (timestampSeconds: number) => {
  const safeSeconds = Number.isInteger(timestampSeconds) && timestampSeconds > 0 ? timestampSeconds : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};

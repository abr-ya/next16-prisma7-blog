export const formatVideoProvider = (provider?: string | null) => {
  if (!provider) return null;

  if (provider === "youtube") return "YouTube";

  return provider;
};

export const formatVideoDuration = (durationSeconds?: number | null) => {
  if (!durationSeconds || durationSeconds < 1) return null;

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

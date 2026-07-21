import { emptyVideoProviderMetadata, type VideoProviderMetadata } from "./metadata";
import { extractYouTubeMetadata } from "./youtube";

export type { VideoProviderMetadata } from "./metadata";

export const extractVideoProviderMetadata = (value: string): VideoProviderMetadata => {
  try {
    const youtubeMetadata = extractYouTubeMetadata(value);

    if (youtubeMetadata.provider) return youtubeMetadata;

    return emptyVideoProviderMetadata();
  } catch {
    return emptyVideoProviderMetadata();
  }
};

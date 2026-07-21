export type VideoProviderMetadata = {
  provider: string | null;
  providerVideoId: string | null;
  thumbnailUrl: string | null;
  embedUrl: string | null;
  durationSeconds: number | null;
};

export const emptyVideoProviderMetadata = (): VideoProviderMetadata => ({
  provider: null,
  providerVideoId: null,
  thumbnailUrl: null,
  embedUrl: null,
  durationSeconds: null,
});

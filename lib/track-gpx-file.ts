import { parseTrackGpxMetadata } from "@/lib/track-gpx-parser";

export const fetchTrackGpxContent = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to read GPX file from storage");
    }

    return response.text();
  } catch {
    throw new Error("Unable to read GPX file from storage");
  }
};

/**
 * The metadata a row carries for a GPX file, parsed from the file's content.
 *
 * A file that could not be read from storage leaves the row in a state the
 * owner can repair from the track form: the parse failed, and the reason says
 * why. Every other parse result is persisted as it is.
 */
export const buildTrackGpxMetadata = ({
  content,
  fileAssetId,
  fileKey,
}: {
  content: string;
  fileAssetId: string;
  fileKey: string;
}) => {
  const metadata = parseTrackGpxMetadata({
    content,
    sourceFileAssetId: fileAssetId,
    sourceFileKey: fileKey,
  });

  if (content.length > 0) return metadata;

  return {
    ...metadata,
    gpxParse: {
      ...metadata.gpxParse,
      errorMessage: "Unable to read GPX file from storage",
    },
  };
};

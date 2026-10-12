import "server-only";

import { UTApi } from "uploadthing/server";

/**
 * Server-side UploadThing client. Lazily constructed so the env-key read
 * happens on first use rather than at module-load time (keeps `next build`
 * happy even when `UPLOADTHING_TOKEN` is not present in the build environment).
 */
const getUtapi = () => new UTApi();

export type UploadSyntheticTrackGpxInput = {
  bytes: Uint8Array | string;
  ownerUserId: string;
  filename?: string;
};

export type UploadSyntheticTrackGpxResult = {
  key: string;
  url: string;
  name: string;
  sizeBytes: number;
};

/**
 * Server-side equivalent of the browser `trackGpxUploader` route used by
 * feature-111's `createManualTrack` to persist a synthetic GPX byte string
 * (built from placed map points) into the same UploadThing storage bucket
 * that uploaded GPX files use. Returns the canonical UploadThing key/url
 * pair so the caller can persist a `FileAsset` row that matches the shape
 * produced by the existing client upload route.
 */
export const uploadSyntheticTrackGpx = async ({
  bytes,
  ownerUserId,
  filename = "manual-track.gpx",
}: UploadSyntheticTrackGpxInput): Promise<UploadSyntheticTrackGpxResult> => {
  // The owner id is accepted as part of the input so the call site reads as
  // "write a GPX for this user" and a future migration can attach the owner
  // without re-plumbing the caller. This helper does not persist it; the
  // `FileAsset` row is created by the caller.
  void ownerUserId;
  const utapi = getUtapi();
  const buffer = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  const file = new File([new Uint8Array(buffer)], filename, { type: "application/gpx+xml" });
  const result = await utapi.uploadFiles(file);

  if (!result) {
    throw new Error("UploadThing upload returned no result");
  }

  if (result.error) {
    throw new Error(result.error.message || "UploadThing upload failed");
  }

  const data = result.data;

  if (!data) {
    throw new Error("UploadThing upload returned no data");
  }

  return {
    key: data.key,
    url: data.ufsUrl,
    name: data.name,
    sizeBytes: data.size,
  };
};

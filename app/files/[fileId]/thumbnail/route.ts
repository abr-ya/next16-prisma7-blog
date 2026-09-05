import { NextRequest, NextResponse } from "next/server";

import { getFileAssetForThumbnail } from "@/app/_data/files";

export const runtime = "nodejs";

const THUMBNAIL_MAX_EDGE_PX = 640;
const THUMBNAIL_CACHE_CONTROL = "public, max-age=604800, stale-while-revalidate=86400";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  let stage = "start";
  let fileId: string | null = null;

  try {
    stage = "params";
    ({ fileId } = await params);

    stage = "file-access";
    const fileAsset = await getFileAssetForThumbnail(fileId);

    stage = "provider-fetch";
    const providerResponse = await fetch(fileAsset.url);

    if (!providerResponse.ok) {
      console.error(`Failed to fetch file from provider for thumbnail: ${providerResponse.status}`);
      return NextResponse.json({ error: "Failed to retrieve file from storage" }, { status: 500 });
    }

    stage = "provider-bytes";
    const sourceBytes = Buffer.from(await providerResponse.arrayBuffer());

    stage = "sharp-import";
    const { default: sharp } = await import("sharp");

    stage = "sharp-transform";
    const thumbnailBytes = await sharp(sourceBytes)
      .rotate()
      .resize({
        width: THUMBNAIL_MAX_EDGE_PX,
        height: THUMBNAIL_MAX_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 72 })
      .toBuffer();

    stage = "response";
    const headers = new Headers();
    headers.set("Content-Type", "image/webp");
    headers.set("Content-Length", String(thumbnailBytes.byteLength));
    headers.set("Cache-Control", THUMBNAIL_CACHE_CONTROL);
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(`${fileAsset.name}.webp`)}"`);

    return new NextResponse(new Uint8Array(thumbnailBytes), {
      status: 200,
      headers,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage === "File not found") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (errorMessage === "Authentication required" || errorMessage === "Access denied") {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    console.error("Thumbnail route error:", {
      stage,
      fileId,
      name: error instanceof Error ? error.name : "UnknownError",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

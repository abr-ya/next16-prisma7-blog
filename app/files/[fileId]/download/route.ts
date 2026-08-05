import { NextRequest, NextResponse } from "next/server";

import { getFileAssetForDownload, logFileDownload } from "@/app/_data/files";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;

    // Get session for access control
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    // Check access and get file asset
    const fileAsset = await getFileAssetForDownload(fileId, userId);

    // Log download attempt
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logFileDownload(fileId, userId, ipAddress);

    // Fetch file from provider
    const fileResponse = await fetch(fileAsset.url);

    if (!fileResponse.ok) {
      console.error(`Failed to fetch file from provider: ${fileResponse.status}`);
      return NextResponse.json({ error: "Failed to retrieve file from storage" }, { status: 500 });
    }

    // Stream file to client with appropriate headers
    const headers = new Headers();
    headers.set("Content-Type", fileAsset.mimeType);
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileAsset.name)}"`);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Copy provider content-length if available
    const contentLength = fileResponse.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(fileResponse.body, {
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

    console.error("Download route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

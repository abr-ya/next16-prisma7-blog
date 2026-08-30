import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { canUserUploadGeneralFiles, recordUploadThingFileAsset } from "@/app/_data/files";
import { auth } from "@/lib/auth";
import {
  GENERAL_FILE_UPLOAD_MAX_COUNT,
  GENERAL_FILE_UPLOAD_MAX_SIZE,
  OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT,
  OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE,
  TRACK_GPX_UPLOAD_MAX_SIZE,
} from "@/lib/file-upload-limits";
import { validateGpxContent, validateGpxUploadMetadata } from "@/lib/gpx-validation";
import prisma from "@/lib/prisma";

const f = createUploadthing();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const legacyImageAuth = (_req: Request) => ({ id: "fakeId" }); // Existing image route behavior.

const getUploadSession = async (req: Request) => {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) throw new UploadThingError("Unauthorized");

  return session;
};

const readUploadThingFileTextSample = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      Range: "bytes=0-4095",
    },
  });

  if (!response.ok) {
    throw new UploadThingError("Could not validate GPX content");
  }

  return response.text();
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "1MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await legacyImageAuth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      try {
        await prisma.log.create({
          data: {
            action: "uploadImage",
            userId: metadata.userId,
            details: JSON.stringify({
              fileUrl: file.ufsUrl,
              fileName: file.name,
              fileSize: file.size,
            }),
          },
        });
      } catch (err) {
        console.error("Failed to log image upload:", err);
      }

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  fileUploader: f({
    blob: {
      maxFileSize: GENERAL_FILE_UPLOAD_MAX_SIZE,
      maxFileCount: GENERAL_FILE_UPLOAD_MAX_COUNT,
      contentDisposition: "attachment",
    },
  })
    .middleware(async ({ req, files }) => {
      const session = await getUploadSession(req);
      const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
      const allowed = await canUserUploadGeneralFiles(session.user.id, incomingBytes);

      if (!allowed) {
        throw new UploadThingError("File storage limit reached");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const fileAsset = await recordUploadThingFileAsset({
          userId: metadata.userId,
          fileKey: file.key,
          customId: file.customId,
          url: file.ufsUrl,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });

        return { fileAssetId: fileAsset.id };
      } catch (err) {
        console.error("Failed to record file asset:", err);
        throw new UploadThingError("Failed to record uploaded file");
      }
    }),
  trackGpxUploader: f({
    blob: {
      maxFileSize: TRACK_GPX_UPLOAD_MAX_SIZE,
      maxFileCount: 1,
      contentDisposition: "attachment",
    },
  })
    .middleware(async ({ req, files }) => {
      const session = await getUploadSession(req);
      const incomingFile = files.at(0);

      if (!incomingFile) {
        throw new UploadThingError("GPX file is required");
      }

      try {
        validateGpxUploadMetadata({ name: incomingFile.name, type: incomingFile.type });
      } catch (error) {
        throw new UploadThingError(error instanceof Error ? error.message : "Invalid GPX file");
      }

      const allowed = await canUserUploadGeneralFiles(session.user.id, incomingFile.size);

      if (!allowed) {
        throw new UploadThingError("File storage limit reached");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        validateGpxUploadMetadata({ name: file.name, type: file.type });
        validateGpxContent(await readUploadThingFileTextSample(file.ufsUrl));

        const fileAsset = await recordUploadThingFileAsset({
          userId: metadata.userId,
          fileKey: file.key,
          customId: file.customId,
          url: file.ufsUrl,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          purpose: "TRACK_GPX",
          visibility: "PRIVATE",
        });

        return { fileAssetId: fileAsset.id };
      } catch (err) {
        console.error("Failed to record GPX track file asset:", err);
        throw new UploadThingError(err instanceof Error ? err.message : "Failed to record GPX track file");
      }
    }),
  outdoorPhotoImageUploader: f({
    image: {
      maxFileSize: OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_SIZE,
      maxFileCount: OUTDOOR_PHOTO_IMAGE_UPLOAD_MAX_COUNT,
      contentDisposition: "attachment",
    },
  })
    .middleware(async ({ req, files }) => {
      const session = await getUploadSession(req);
      const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
      const allowed = await canUserUploadGeneralFiles(session.user.id, incomingBytes);

      if (!allowed) {
        throw new UploadThingError("File storage limit reached");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const fileAsset = await recordUploadThingFileAsset({
          userId: metadata.userId,
          fileKey: file.key,
          customId: file.customId,
          url: file.ufsUrl,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          purpose: "OUTDOOR_PHOTO_IMAGE",
          visibility: "PRIVATE",
        });

        return { fileAssetId: fileAsset.id };
      } catch (err) {
        console.error("Failed to record outdoor photo image file asset:", err);
        throw new UploadThingError("Failed to record outdoor photo image");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

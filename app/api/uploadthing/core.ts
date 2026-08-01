import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { canUserUploadGeneralFiles, recordUploadThingFileAsset } from "@/app/_data/files";
import { auth } from "@/lib/auth";
import { GENERAL_FILE_UPLOAD_MAX_COUNT, GENERAL_FILE_UPLOAD_MAX_SIZE } from "@/lib/file-upload-limits";
import prisma from "@/lib/prisma";

const f = createUploadthing();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const legacyImageAuth = (_req: Request) => ({ id: "fakeId" }); // Existing image route behavior.

const getUploadSession = async (req: Request) => {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) throw new UploadThingError("Unauthorized");

  return session;
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

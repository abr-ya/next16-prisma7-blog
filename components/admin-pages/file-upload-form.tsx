"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { UploadDropzone } from "@/lib/uploadthing";

export const FileUploadForm = () => {
  const router = useRouter();

  return (
    <UploadDropzone
      endpoint="fileUploader"
      content={{
        label: "Drop or click to upload a file",
        allowedContent: "One file up to 64MB.",
      }}
      appearance={{
        button: "rounded-lg",
        container: "rounded-lg border",
      }}
      onUploadError={(error) => {
        toast.error(error.message || "Uploading file failed");
      }}
      onClientUploadComplete={() => {
        toast.success("File uploaded");
        router.refresh();
      }}
    />
  );
};

"use client";

import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { FileAssetWithOwner } from "@/app/_data/files";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/file-upload-limits";

const TEXT_PREVIEW_SIZE_LIMIT_BYTES = 256 * 1024;

export type FilePreviewKind = "image" | "pdf" | "text" | "unsupported";

type FilePreviewDialogProps = {
  file: FileAssetWithOwner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const getFilePreviewKind = (mimeType: string): FilePreviewKind => {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.startsWith("image/")) return "image";
  if (normalizedMimeType === "application/pdf") return "pdf";
  if (normalizedMimeType.startsWith("text/")) return "text";

  const textLikeMimeTypes = new Set([
    "application/json",
    "application/ld+json",
    "application/xml",
    "application/yaml",
    "application/x-yaml",
    "application/javascript",
    "application/typescript",
    "application/x-sh",
    "application/sql",
  ]);

  if (textLikeMimeTypes.has(normalizedMimeType) || normalizedMimeType.endsWith("+json")) return "text";

  return "unsupported";
};

export const isFilePreviewable = (mimeType: string) => getFilePreviewKind(mimeType) !== "unsupported";

const getPreviewUrl = (fileId: string) => `/files/${fileId}/download?disposition=inline`;
const getDownloadUrl = (fileId: string) => `/files/${fileId}/download`;

const TextPreviewContent = ({ previewUrl }: { previewUrl: string }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(previewUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load preview");
        return response.text();
      })
      .then((content) => setText(content))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load preview");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        Loading preview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <pre className="max-h-[60vh] min-h-64 overflow-auto rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
      {text || "This file is empty."}
    </pre>
  );
};

const TextPreview = ({ file, previewUrl }: { file: FileAssetWithOwner; previewUrl: string }) => {
  if (file.sizeBytes > TEXT_PREVIEW_SIZE_LIMIT_BYTES) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Inline preview is unavailable for text files larger than {formatFileSize(TEXT_PREVIEW_SIZE_LIMIT_BYTES)}.
      </div>
    );
  }

  return <TextPreviewContent key={previewUrl} previewUrl={previewUrl} />;
};

export const FilePreviewDialog = ({ file, open, onOpenChange }: FilePreviewDialogProps) => {
  const previewKind = useMemo(() => (file ? getFilePreviewKind(file.mimeType) : "unsupported"), [file]);

  if (!file) return null;

  const previewUrl = getPreviewUrl(file.id);
  const downloadUrl = getDownloadUrl(file.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl" aria-describedby="file-preview-description">
        <DialogHeader>
          <DialogTitle className="max-w-[calc(100%-2rem)] truncate" title={file.name}>
            {file.name}
          </DialogTitle>
          <DialogDescription id="file-preview-description">
            {file.mimeType} · {formatFileSize(file.sizeBytes)}
          </DialogDescription>
        </DialogHeader>

        {previewKind === "image" ? (
          <div className="flex max-h-[65vh] min-h-64 items-center justify-center overflow-auto rounded-md border bg-muted/30 p-3">
            <img src={previewUrl} alt={file.name} className="max-h-[60vh] max-w-full object-contain" />
          </div>
        ) : null}

        {previewKind === "pdf" ? (
          <iframe title={file.name} src={previewUrl} className="h-[65vh] w-full rounded-md border bg-muted/30" />
        ) : null}

        {previewKind === "text" ? <TextPreview file={file} previewUrl={previewUrl} /> : null}

        {previewKind === "unsupported" ? (
          <div className="flex min-h-64 items-center justify-center rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Inline preview is unavailable for this file type.
          </div>
        ) : null}

        <DialogFooter>
          <Button asChild variant="outline">
            <a href={downloadUrl}>
              <Download />
              Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

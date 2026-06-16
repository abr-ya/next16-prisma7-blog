"use client";

import Image from "next/image";
import { useState } from "react";

type VideoThumbnailProps = {
  src?: string | null;
  title: string;
  videoUrl: string;
};

export const VideoThumbnail = ({ src, title, videoUrl }: VideoThumbnailProps) => {
  const [hasError, setHasError] = useState(false);
  const shouldShowImage = src && !hasError;

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${title} video in a new tab`}
      className="relative block aspect-[4/3] w-full max-w-md overflow-hidden rounded-md border bg-muted transition-opacity hover:opacity-90"
    >
      {shouldShowImage ? (
        <Image
          src={src}
          alt={`${title} thumbnail`}
          fill
          priority
          sizes="(min-width: 768px) 28rem, calc(100vw - 2rem)"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/70 px-6 text-center text-sm text-muted-foreground">
          No thumbnail available
        </div>
      )}
    </a>
  );
};

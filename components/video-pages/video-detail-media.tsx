"use client";

import { Eye, PlayCircle } from "lucide-react";
import { useState } from "react";

import { Badge, Button } from "@/components/index";
import { VideoThumbnail } from "@/components/video-pages/video-thumbnail";

type VideoDetailMediaProps = {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  embedUrl?: string | null;
};

type MediaMode = "preview" | "player";

const unavailablePlayerReason = "Player is unavailable for this video.";

export const VideoDetailMedia = ({ title, videoUrl, thumbnailUrl, embedUrl }: VideoDetailMediaProps) => {
  const [mode, setMode] = useState<MediaMode>("preview");
  const canUsePlayer = Boolean(embedUrl);
  const shouldShowPlayer = mode === "player" && canUsePlayer;

  return (
    <section className="grid gap-3" aria-label="Video media">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={mode === "preview" ? "secondary" : "outline"}>Preview</Badge>
          <Badge variant={shouldShowPlayer ? "secondary" : "outline"}>
            {canUsePlayer ? "Player available" : "Player unavailable"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant={mode === "preview" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            <Eye className="size-4" />
            Preview
          </Button>
          <Button
            type="button"
            variant={shouldShowPlayer ? "secondary" : "outline"}
            size="sm"
            disabled={!canUsePlayer}
            title={canUsePlayer ? "Show player" : unavailablePlayerReason}
            onClick={() => {
              if (canUsePlayer) setMode("player");
            }}
          >
            <PlayCircle className="size-4" />
            Player
          </Button>
        </div>
      </div>

      {shouldShowPlayer ? (
        <iframe
          src={embedUrl ?? undefined}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full rounded-md border bg-muted"
        />
      ) : (
        <VideoThumbnail src={thumbnailUrl} title={title} videoUrl={videoUrl} className="aspect-video max-w-none" />
      )}

      {!canUsePlayer ? <p className="text-sm text-muted-foreground">{unavailablePlayerReason}</p> : null}
    </section>
  );
};

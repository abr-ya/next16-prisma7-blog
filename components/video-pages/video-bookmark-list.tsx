"use client";

import { Edit2, ExternalLink, Trash2 } from "lucide-react";

import type { PublicVideoBookmark } from "@/app/_data/video-bookmarks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatVideoTimestamp, getVideoTimestampUrl } from "@/lib/video-timestamp-url";

type VideoBookmarkListProps = {
  bookmarks: PublicVideoBookmark[];
  videoUrl: string;
  emptyMessage: string;
  showOwner: boolean;
  pendingAction: string | null;
  onEdit: (bookmark: PublicVideoBookmark) => void;
  onDelete: (bookmark: PublicVideoBookmark) => void;
};

type VideoBookmarkListItemProps = {
  bookmark: PublicVideoBookmark;
  videoUrl: string;
  showOwner: boolean;
  isPending: boolean;
  hasPendingAction: boolean;
  onEdit: (bookmark: PublicVideoBookmark) => void;
  onDelete: (bookmark: PublicVideoBookmark) => void;
};

const VideoBookmarkListItem = ({
  bookmark,
  videoUrl,
  showOwner,
  isPending,
  hasPendingAction,
  onEdit,
  onDelete,
}: VideoBookmarkListItemProps) => {
  const timestampUrl = getVideoTimestampUrl(videoUrl, bookmark.timestampSeconds);

  return (
    <div className="rounded-md border p-4">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{formatVideoTimestamp(bookmark.timestampSeconds)}</Badge>
              {bookmark.label ? <h2 className="text-sm font-semibold">{bookmark.label}</h2> : null}
            </div>
            {showOwner ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Saved by {bookmark.isOwnedByCurrentUser ? "you" : bookmark.ownerName}
              </p>
            ) : null}
            {bookmark.note ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{bookmark.note}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            {timestampUrl ? (
              <Button asChild variant="ghost" size="icon" title="Open timestamp">
                <a href={timestampUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : null}
            {bookmark.isOwnedByCurrentUser ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Edit bookmark"
                  disabled={hasPendingAction}
                  onClick={() => onEdit(bookmark)}
                >
                  <Edit2 className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Delete bookmark"
                  className="text-destructive hover:text-destructive"
                  disabled={hasPendingAction}
                  onClick={() => onDelete(bookmark)}
                >
                  {isPending ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoBookmarkList = ({
  bookmarks,
  videoUrl,
  emptyMessage,
  showOwner,
  pendingAction,
  onEdit,
  onDelete,
}: VideoBookmarkListProps) => {
  if (bookmarks.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {bookmarks.map((bookmark) => (
        <VideoBookmarkListItem
          key={bookmark.id}
          bookmark={bookmark}
          videoUrl={videoUrl}
          showOwner={showOwner}
          isPending={pendingAction === bookmark.id}
          hasPendingAction={Boolean(pendingAction)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

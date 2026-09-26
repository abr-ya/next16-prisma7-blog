"use client";

import { format } from "date-fns";
import type { ReactNode } from "react";

import { CommentText } from "@/components/common/comment-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/index";
import type { CommentListItem } from "@/lib/comments";

type CommentListProps = {
  comments: CommentListItem[];
  emptyState: ReactNode;
  renderTarget?: (comment: CommentListItem) => ReactNode;
  renderActions?: (comment: CommentListItem) => ReactNode;
};

const avatarFallbackText = (name?: string | null): string => {
  const normalizedName = name?.trim();

  if (!normalizedName) return "?";

  const parts = normalizedName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const word = parts[0];

  return word.length >= 2 ? word.slice(0, 2).toUpperCase() : word[0].toUpperCase();
};

const formatCommentDate = (value: string) => format(new Date(value), "PPP");

export const CommentList = ({ comments, emptyState, renderTarget, renderActions }: CommentListProps) => {
  if (comments.length === 0) return <>{emptyState}</>;

  return (
    <div className="grid gap-3">
      {comments.map((comment) => {
        const authorName = comment.author.displayName || "Anonymous";
        const target = renderTarget?.(comment);
        const actions = renderActions?.(comment);
        const hasExtras = Boolean(target) || Boolean(actions);

        return (
          <article key={comment.id} className="rounded-md border p-4">
            <div className="flex min-w-0 gap-3">
              <Avatar className="size-9 shrink-0 rounded-full">
                {comment.author.image ? (
                  <AvatarImage src={comment.author.image} alt={`${authorName}'s avatar`} />
                ) : null}
                <AvatarFallback delayMs={comment.author.image ? 600 : 0}>
                  {avatarFallbackText(authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h2 className="text-sm font-semibold leading-none">{authorName}</h2>
                  <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
                    {formatCommentDate(comment.createdAt)}
                  </time>
                </div>
                <CommentText
                  value={comment.content}
                  className="whitespace-pre-wrap wrap-break-word text-sm text-muted-foreground"
                />
                {hasExtras ? (
                  <div className="flex items-center gap-2">
                    {target}
                    {actions}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

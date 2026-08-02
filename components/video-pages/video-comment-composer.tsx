"use client";

import { format } from "date-fns";
import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createVideoComment, type PublicVideoComment } from "@/app/_data/video-comments";
import { CommentText } from "@/components/common/comment-text";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/index";

const MAX_COMMENT_CONTENT_LENGTH = 2000;

type VideoCommentListItem = Omit<PublicVideoComment, "createdAt"> & {
  createdAt: string;
};

type VideoCommentComposerProps = {
  videoId: string;
  initialComments: VideoCommentListItem[];
  isAuthenticated: boolean;
};

const formatCommentCount = (count: number) => {
  if (count === 0) return "No comments yet";
  if (count === 1) return "1 comment";

  return `${count} comments`;
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

export const VideoCommentComposer = ({ videoId, initialComments, isAuthenticated }: VideoCommentComposerProps) => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [commentCount, setCommentCount] = useState(initialComments.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedContent = content.trim();
  const isSubmitDisabled = isSubmitting || trimmedContent.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) return;

    setIsSubmitting(true);

    try {
      await createVideoComment({ videoId, content: trimmedContent });

      setContent("");
      setCommentCount((currentCount) => currentCount + 1);
      toast.success("Comment added");
      router.refresh();
    } catch {
      toast.error("Comment was not added");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gap-4 rounded-md">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Comments
          </CardTitle>
          <CardDescription>{formatCommentCount(commentCount)}</CardDescription>
        </div>
        {!isAuthenticated ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/sign-in">Sign in to comment</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5">
        {initialComments.length > 0 ? (
          <div className="grid gap-3">
            {initialComments.map((comment) => {
              const authorName = comment.user.name || "Anonymous";

              return (
                <article key={comment.id} className="rounded-md border p-4">
                  <div className="flex min-w-0 gap-3">
                    <Avatar className="size-9 shrink-0 rounded-full">
                      {comment.user.image ? (
                        <AvatarImage src={comment.user.image} alt={`${authorName}'s avatar`} />
                      ) : null}
                      <AvatarFallback delayMs={comment.user.image ? 600 : 0}>
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
            No comments yet. Be the first to start the discussion.
          </div>
        )}

        {isAuthenticated ? (
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="video-comment-content">
                Add a comment
              </label>
              <textarea
                id="video-comment-content"
                maxLength={MAX_COMMENT_CONTENT_LENGTH}
                value={content}
                disabled={isSubmitting}
                placeholder="Share a note about this video..."
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 min-h-24 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                onChange={(event) => setContent(event.target.value)}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {trimmedContent.length}/{MAX_COMMENT_CONTENT_LENGTH}
              </p>
              <Button type="submit" disabled={isSubmitDisabled} className="w-full sm:w-auto">
                {isSubmitting ? <Spinner className="size-4" /> : <Send className="size-4" />}
                Add comment
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
};

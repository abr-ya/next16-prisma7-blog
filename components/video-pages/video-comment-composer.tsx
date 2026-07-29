"use client";

import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createVideoComment } from "@/app/_data/video-comments";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from "@/components/index";

const MAX_COMMENT_CONTENT_LENGTH = 2000;

type VideoCommentComposerProps = {
  videoId: string;
  initialCommentCount: number;
  isAuthenticated: boolean;
};

const formatCommentCount = (count: number) => {
  if (count === 0) return "No comments yet";
  if (count === 1) return "1 comment";

  return `${count} comments`;
};

export const VideoCommentComposer = ({ videoId, initialCommentCount, isAuthenticated }: VideoCommentComposerProps) => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [commentCount, setCommentCount] = useState(initialCommentCount);
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
          <CardDescription>{formatCommentCount(commentCount)}. Comment list coming soon.</CardDescription>
        </div>
        {!isAuthenticated ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/sign-in">Sign in to comment</Link>
          </Button>
        ) : null}
      </CardHeader>
      {isAuthenticated ? (
        <CardContent>
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
        </CardContent>
      ) : null}
    </Card>
  );
};

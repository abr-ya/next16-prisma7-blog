"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createVideoComment } from "@/app/_data/video-comments";
import { CommentComposer } from "@/components/comments/comment-composer";
import { CommentList } from "@/components/comments/comment-list";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/index";
import type { CommentListItem } from "@/lib/comments";

const MAX_COMMENT_CONTENT_LENGTH = 2000;

type VideoCommentComposerProps = {
  videoId: string;
  initialComments: CommentListItem[];
  isAuthenticated: boolean;
};

const formatCommentCount = (count: number) => {
  if (count === 0) return "No comments yet";
  if (count === 1) return "1 comment";

  return `${count} comments`;
};

export const VideoCommentComposer = ({ videoId, initialComments, isAuthenticated }: VideoCommentComposerProps) => {
  const router = useRouter();
  const [commentCount, setCommentCount] = useState(initialComments.length);

  const handleCreate = async (content: string) => {
    await createVideoComment({ videoId, content });
    setCommentCount((currentCount) => currentCount + 1);
    toast.success("Comment added");
    router.refresh();
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
        <CommentList
          comments={initialComments}
          emptyState={
            <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
              No comments yet. Be the first to start the discussion.
            </div>
          }
        />

        {isAuthenticated ? (
          <CommentComposer
            id="video-comment-content"
            label="Add a comment"
            placeholder="Share a note about this video..."
            maxLength={MAX_COMMENT_CONTENT_LENGTH}
            submitLabel="Add comment"
            onSubmit={handleCreate}
            onSubmitError={() => toast.error("Comment was not added")}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

"use client";

import { MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createPhotoComment,
  deletePhotoComment,
  updatePhotoComment,
} from "@/app/_data/photo-comments";
import { CommentComposer } from "@/components/comments/comment-composer";
import { CommentList } from "@/components/comments/comment-list";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/index";
import type { CommentListItem } from "@/lib/comments";

const MAX_COMMENT_CONTENT_LENGTH = 2000;

const formatCommentCount = (count: number) => {
  if (count === 0) return "No comments yet";
  if (count === 1) return "1 comment";

  return `${count} comments`;
};

const normalize = (value: string) => value.trim();

type HikePhotoCommentComposerProps = {
  photoId: string;
  initialComments: CommentListItem[];
  isAuthenticated: boolean;
  currentUserId?: string | null;
};

type EditingState = {
  id: string;
  value: string;
};

export const HikePhotoCommentComposer = ({
  photoId,
  initialComments,
  isAuthenticated,
  currentUserId,
}: HikePhotoCommentComposerProps) => {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const commentCount = comments.length;

  const handleCreate = async (content: string) => {
    const created = await createPhotoComment({ photoId, content });

    const next: CommentListItem = {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
      author: {
        id: created.user.id,
        displayName: created.user.name,
        image: created.user.image,
      },
      target: comments[0]?.target ?? {
        type: "photo",
        title: "Photo",
        href: `/trips`,
        previewImageUrl: null,
      },
    };

    setComments((current) => [...current, next]);
    toast.success("Comment added");
    router.refresh();
  };

  const startEditing = (comment: CommentListItem) => {
    setEditing({ id: comment.id, value: comment.content });
  };

  const cancelEditing = () => setEditing(null);

  const submitEditing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    const trimmed = normalize(editing.value);
    if (!trimmed) {
      toast.error("Comment content is required");
      return;
    }

    setIsMutating(true);
    try {
      const updated = await updatePhotoComment({ id: editing.id, photoId, content: trimmed });
      setComments((current) =>
        current.map((comment) =>
          comment.id === editing.id
            ? {
                ...comment,
                content: updated.content,
              }
            : comment,
        ),
      );
      setEditing(null);
      toast.success("Comment updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update comment");
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setIsMutating(true);
    try {
      const result = await deletePhotoComment(pendingDeleteId);
      if (result.success) {
        setComments((current) => current.filter((comment) => comment.id !== pendingDeleteId));
        toast.success("Comment deleted");
        router.refresh();
        setPendingDeleteId(null);
      } else {
        toast.error("Comment not found");
        setPendingDeleteId(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete comment");
      setPendingDeleteId(null);
    } finally {
      setIsMutating(false);
    }
  };

  const renderActions = (comment: CommentListItem) => {
    const isOwner = currentUserId !== undefined && comment.author.id === currentUserId;
    if (!isOwner) return null;
    if (editing?.id === comment.id) return null;

    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => startEditing(comment)}
          aria-label="Edit comment"
        >
          <Pencil />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPendingDeleteId(comment.id)}
          aria-label="Delete comment"
        >
          <Trash2 />
          Delete
        </Button>
      </>
    );
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
          comments={comments}
          emptyState={
            <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
              No comments yet. Be the first to start the discussion.
            </div>
          }
          renderActions={renderActions}
        />

        {editing ? (
          <form className="grid gap-3 rounded-md border p-3" onSubmit={submitEditing}>
            <label className="text-sm font-medium" htmlFor={`hike-photo-comment-edit-${editing.id}`}>
              Edit comment
            </label>
            <textarea
              id={`hike-photo-comment-edit-${editing.id}`}
              maxLength={MAX_COMMENT_CONTENT_LENGTH}
              value={editing.value}
              disabled={isMutating}
              onChange={(event) =>
                setEditing((current) => (current ? { ...current, value: event.target.value } : current))
              }
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 md:text-sm"
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {editing.value.trim().length}/{MAX_COMMENT_CONTENT_LENGTH}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isMutating}
                >
                  <X />
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isMutating || editing.value.trim().length === 0}>
                  <Send />
                  Save
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        {isAuthenticated ? (
          <CommentComposer
            id="hike-photo-comment-content"
            label="Add a comment"
            placeholder="Share a note about this photo..."
            maxLength={MAX_COMMENT_CONTENT_LENGTH}
            submitLabel="Add comment"
            onSubmit={handleCreate}
            onSubmitError={() => toast.error("Comment was not added")}
          />
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open && !isMutating) setPendingDeleteId(null);
        }}
        title="Delete this comment?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        isPending={isMutating}
        onConfirm={confirmDelete}
      />
    </Card>
  );
};

type HikePhotoCommentSectionProps = {
  photoId: string;
  initialComments: CommentListItem[];
  isAuthenticated: boolean;
  currentUserId?: string | null;
  canViewFullPhotos: boolean;
};

/**
 * Lightbox-friendly wrapper that short-circuits rendering for anonymous
 * viewers. Mounted inside the trip photo lightbox; mirrors the signed-in
 * boundary used by photo likes (feature-080) and full-size image access
 * (feature-057).
 */
export const HikePhotoCommentSection = ({
  photoId,
  initialComments,
  isAuthenticated,
  currentUserId,
  canViewFullPhotos,
}: HikePhotoCommentSectionProps) => {
  if (!canViewFullPhotos) return null;

  return (
    <HikePhotoCommentComposer
      photoId={photoId}
      initialComments={initialComments}
      isAuthenticated={isAuthenticated}
      currentUserId={currentUserId}
    />
  );
};
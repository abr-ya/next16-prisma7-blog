"use client";

import { Edit2, ExternalLink, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createVideoBookmark,
  deleteVideoBookmark,
  updateVideoBookmark,
  type PublicVideoBookmark,
} from "@/app/_data/video-bookmarks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatVideoTimestamp, getVideoTimestampUrl } from "@/lib/video-timestamp-url";

type VideoBookmarkManagerProps = {
  videoId: string;
  videoUrl: string;
  initialBookmarks: PublicVideoBookmark[];
};

type BookmarkFormValues = {
  timestampSeconds: string;
  label: string;
  note: string;
};

const emptyValues: BookmarkFormValues = {
  timestampSeconds: "",
  label: "",
  note: "",
};

const toFormValues = (bookmark: PublicVideoBookmark): BookmarkFormValues => ({
  timestampSeconds: String(bookmark.timestampSeconds),
  label: bookmark.label ?? "",
  note: bookmark.note ?? "",
});

const sortBookmarks = (bookmarks: PublicVideoBookmark[]) =>
  [...bookmarks].sort((a, b) => {
    if (a.timestampSeconds !== b.timestampSeconds) return a.timestampSeconds - b.timestampSeconds;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

const BookmarkTextFields = ({
  values,
  idPrefix,
  disabled,
  onChange,
}: {
  values: BookmarkFormValues;
  idPrefix: string;
  disabled: boolean;
  onChange: (values: BookmarkFormValues) => void;
}) => (
  <div className="grid gap-3">
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={`${idPrefix}-timestamp`}>
        Timestamp seconds
      </label>
      <Input
        id={`${idPrefix}-timestamp`}
        min={0}
        step={1}
        type="number"
        inputMode="numeric"
        value={values.timestampSeconds}
        disabled={disabled}
        onChange={(event) => onChange({ ...values, timestampSeconds: event.target.value })}
      />
    </div>
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={`${idPrefix}-label`}>
        Label
      </label>
      <Input
        id={`${idPrefix}-label`}
        maxLength={80}
        value={values.label}
        disabled={disabled}
        onChange={(event) => onChange({ ...values, label: event.target.value })}
      />
    </div>
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={`${idPrefix}-note`}>
        Note
      </label>
      <textarea
        id={`${idPrefix}-note`}
        maxLength={500}
        value={values.note}
        disabled={disabled}
        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 min-h-20 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        onChange={(event) => onChange({ ...values, note: event.target.value })}
      />
    </div>
  </div>
);

export const VideoBookmarkManager = ({ videoId, videoUrl, initialBookmarks }: VideoBookmarkManagerProps) => {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState(() => sortBookmarks(initialBookmarks));
  const [createValues, setCreateValues] = useState<BookmarkFormValues>(emptyValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<BookmarkFormValues>(emptyValues);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const editingBookmark = useMemo(
    () => bookmarks.find((bookmark) => bookmark.id === editingId) ?? null,
    [bookmarks, editingId],
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingAction("create");

    try {
      const bookmark = await createVideoBookmark({ videoId, ...createValues });

      setBookmarks((current) => sortBookmarks([...current, bookmark]));
      setCreateValues(emptyValues);
      toast.success("Bookmark saved");
      router.refresh();
    } catch {
      toast.error("Bookmark was not saved");
    } finally {
      setPendingAction(null);
    }
  };

  const startEditing = (bookmark: PublicVideoBookmark) => {
    setEditingId(bookmark.id);
    setEditingValues(toFormValues(bookmark));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValues(emptyValues);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingBookmark) return;

    setPendingAction(editingBookmark.id);

    try {
      const bookmark = await updateVideoBookmark({
        id: editingBookmark.id,
        videoId,
        ...editingValues,
      });

      setBookmarks((current) => sortBookmarks(current.map((item) => (item.id === bookmark.id ? bookmark : item))));
      cancelEditing();
      toast.success("Bookmark updated");
      router.refresh();
    } catch {
      toast.error("Bookmark was not updated");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async (bookmark: PublicVideoBookmark) => {
    setPendingAction(bookmark.id);

    try {
      const result = await deleteVideoBookmark(bookmark.id);

      if (!result.success) {
        toast.error("Bookmark was not deleted");
        return;
      }

      setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
      toast.success("Bookmark deleted");
      router.refresh();
    } catch {
      toast.error("Bookmark was not deleted");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Card className="gap-4 rounded-md">
      <CardHeader className="gap-1">
        <CardTitle>Bookmarks</CardTitle>
        <CardDescription>Your saved moments for this video.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <form className="grid gap-3" onSubmit={handleCreate}>
          <BookmarkTextFields
            values={createValues}
            idPrefix="new-video-bookmark"
            disabled={pendingAction === "create"}
            onChange={setCreateValues}
          />
          <Button type="submit" className="w-fit" disabled={pendingAction === "create"}>
            {pendingAction === "create" ? <Spinner className="size-5" /> : <Plus className="size-4" />}
            Add bookmark
          </Button>
        </form>

        <div className="grid gap-3">
          {bookmarks.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
              No bookmarks yet.
            </div>
          ) : (
            bookmarks.map((bookmark) => {
              const timestampUrl = getVideoTimestampUrl(videoUrl, bookmark.timestampSeconds);
              const isEditing = editingId === bookmark.id;
              const isPending = pendingAction === bookmark.id;

              return (
                <div key={bookmark.id} className="rounded-md border p-4">
                  {isEditing ? (
                    <form className="grid gap-3" onSubmit={handleUpdate}>
                      <BookmarkTextFields
                        values={editingValues}
                        idPrefix={`video-bookmark-${bookmark.id}`}
                        disabled={isPending}
                        onChange={setEditingValues}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" size="sm" disabled={isPending}>
                          {isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
                          Save
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={cancelEditing}>
                          <X className="size-4" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{formatVideoTimestamp(bookmark.timestampSeconds)}</Badge>
                            {bookmark.label ? <h2 className="text-sm font-semibold">{bookmark.label}</h2> : null}
                          </div>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Edit bookmark"
                            disabled={Boolean(pendingAction)}
                            onClick={() => startEditing(bookmark)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Delete bookmark"
                            className="text-destructive hover:text-destructive"
                            disabled={Boolean(pendingAction)}
                            onClick={() => handleDelete(bookmark)}
                          >
                            {isPending ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

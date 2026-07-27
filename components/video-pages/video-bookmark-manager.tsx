"use client";

import { Edit2, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoBookmarkDialog } from "@/components/video-pages/video-bookmark-dialog";
import {
  emptyVideoBookmarkFormValues,
  type VideoBookmarkFormValues,
} from "@/components/video-pages/video-bookmark-form";
import { formatVideoTimestamp, getVideoTimestampUrl } from "@/lib/video-timestamp-url";

type VideoBookmarkManagerProps = {
  videoId: string;
  videoUrl: string;
  initialBookmarks: PublicVideoBookmark[];
};

type BookmarkView = "my" | "all";

const toFormValues = (bookmark: PublicVideoBookmark): VideoBookmarkFormValues => ({
  timestampSeconds: String(bookmark.timestampSeconds),
  label: bookmark.label ?? "",
  note: bookmark.note ?? "",
});

const sortBookmarks = (bookmarks: PublicVideoBookmark[]) =>
  [...bookmarks].sort((a, b) => {
    if (a.timestampSeconds !== b.timestampSeconds) return a.timestampSeconds - b.timestampSeconds;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

export const VideoBookmarkManager = ({ videoId, videoUrl, initialBookmarks }: VideoBookmarkManagerProps) => {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState(() => sortBookmarks(initialBookmarks));
  const [createValues, setCreateValues] = useState<VideoBookmarkFormValues>(emptyVideoBookmarkFormValues);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<BookmarkView>("my");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<VideoBookmarkFormValues>(emptyVideoBookmarkFormValues);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const myBookmarks = useMemo(() => bookmarks.filter((bookmark) => bookmark.isOwnedByCurrentUser), [bookmarks]);

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
      setCreateValues(emptyVideoBookmarkFormValues);
      setCreateDialogOpen(false);
      toast.success("Bookmark saved");
      router.refresh();
    } catch {
      toast.error("Bookmark was not saved");
    } finally {
      setPendingAction(null);
    }
  };

  const startEditing = (bookmark: PublicVideoBookmark) => {
    if (!bookmark.isOwnedByCurrentUser) return;

    setEditingId(bookmark.id);
    setEditingValues(toFormValues(bookmark));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValues(emptyVideoBookmarkFormValues);
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

  const renderBookmarkList = (items: PublicVideoBookmark[], emptyMessage: string, showOwner: boolean) => (
    <div className="grid gap-3">
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        items.map((bookmark) => {
          const timestampUrl = getVideoTimestampUrl(videoUrl, bookmark.timestampSeconds);
          const isPending = pendingAction === bookmark.id;

          return (
            <div key={bookmark.id} className="rounded-md border p-4">
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
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <Card className="gap-4 rounded-md">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <CardTitle>Bookmarks</CardTitle>
          <CardDescription>Your saved moments for this video.</CardDescription>
        </div>
        <VideoBookmarkDialog
          mode="create"
          open={createDialogOpen}
          values={createValues}
          disabled={pendingAction === "create"}
          submitIcon={pendingAction === "create" ? <Spinner className="size-5" /> : <Plus className="size-4" />}
          onOpenChange={setCreateDialogOpen}
          onChange={setCreateValues}
          onSubmit={handleCreate}
          trigger={
            <Button type="button" className="w-full sm:w-auto" disabled={pendingAction === "create"}>
              <Plus className="size-4" />
              Add bookmark
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as BookmarkView)} className="gap-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-fit">
            <TabsTrigger value="my">My bookmarks ({myBookmarks.length})</TabsTrigger>
            <TabsTrigger value="all">All bookmarks ({bookmarks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="my">{renderBookmarkList(myBookmarks, "No bookmarks yet.", false)}</TabsContent>
          <TabsContent value="all">{renderBookmarkList(bookmarks, "No public bookmarks yet.", true)}</TabsContent>
        </Tabs>
      </CardContent>
      <VideoBookmarkDialog
        mode="edit"
        open={Boolean(editingBookmark)}
        values={editingValues}
        disabled={Boolean(editingBookmark && pendingAction === editingBookmark.id)}
        submitIcon={
          editingBookmark && pendingAction === editingBookmark.id ? (
            <Spinner className="size-5" />
          ) : (
            <Save className="size-4" />
          )
        }
        onOpenChange={(open) => {
          if (!open) cancelEditing();
        }}
        onChange={setEditingValues}
        onSubmit={handleUpdate}
      />
    </Card>
  );
};

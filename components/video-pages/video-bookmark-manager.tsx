"use client";

import { Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createVideoBookmark,
  deleteVideoBookmark,
  updateVideoBookmark,
  type PublicVideoBookmark,
} from "@/app/_data/video-bookmarks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoBookmarkDialog } from "@/components/video-pages/video-bookmark-dialog";
import { VideoBookmarkList } from "@/components/video-pages/video-bookmark-list";
import {
  emptyVideoBookmarkFormValues,
  type VideoBookmarkFormValues,
} from "@/components/video-pages/video-bookmark-form";

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
          <TabsContent value="my">
            <VideoBookmarkList
              bookmarks={myBookmarks}
              videoUrl={videoUrl}
              emptyMessage="No bookmarks yet."
              showOwner={false}
              pendingAction={pendingAction}
              onEdit={startEditing}
              onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="all">
            <VideoBookmarkList
              bookmarks={bookmarks}
              videoUrl={videoUrl}
              emptyMessage="No public bookmarks yet."
              showOwner
              pendingAction={pendingAction}
              onEdit={startEditing}
              onDelete={handleDelete}
            />
          </TabsContent>
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

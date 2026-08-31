"use client";

import { Check, GitMerge, MoreHorizontal, Pencil, RotateCcw, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteUnusedContentTag,
  markContentTagNeedsReview,
  markContentTagReviewed,
  mergeContentTag,
  renameContentTag,
  removeContentTagAssignments,
  replaceContentTagAssignments,
} from "@/app/_actions/content-tags";
import type { ContentTagManagementItem } from "@/app/_data/content-tags";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ContentTagsInventorySummary = {
  totalTags: number;
  activeTags: number;
  needsReviewTags: number;
  postAssignments: number;
};

type ContentTagsInventoryProps = {
  tags: ContentTagManagementItem[];
  summary: ContentTagsInventorySummary;
};

type TagActionResult = {
  success: boolean;
  message: string;
};

type PendingAction = "rename" | "mark-active" | "mark-review" | "merge" | "delete" | "remove" | "replace";

type DialogState =
  | { type: "rename"; tag: ContentTagManagementItem }
  | { type: "merge"; tag: ContentTagManagementItem }
  | { type: "delete"; tag: ContentTagManagementItem }
  | { type: "remove"; tag: ContentTagManagementItem }
  | { type: "replace"; tag: ContentTagManagementItem }
  | null;

const formatDate = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatStatus = (status: ContentTagManagementItem["status"]) => {
  const labels: Record<ContentTagManagementItem["status"], string> = {
    ACTIVE: "Active",
    NEEDS_REVIEW: "Needs Review",
  };

  return labels[status];
};

const getStatusBadgeVariant = (status: ContentTagManagementItem["status"]) =>
  status === "ACTIVE" ? "default" : "secondary";

const getSelectedPostIds = (selectedByTag: Record<string, Set<string>>, tagId: string) =>
  Array.from(selectedByTag[tagId] ?? []);

export const ContentTagsInventory = ({ tags, summary }: ContentTagsInventoryProps) => {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [mergeConfirmTag, setMergeConfirmTag] = useState<ContentTagManagementItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mergeTargetValue, setMergeTargetValue] = useState("");
  const [selectedByTag, setSelectedByTag] = useState<Record<string, Set<string>>>({});
  const [replacementByTag, setReplacementByTag] = useState<Record<string, string>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const isPending = pendingKey !== null;

  const openRenameDialog = (tag: ContentTagManagementItem) => {
    setRenameValue(tag.name);
    setDialog({ type: "rename", tag });
  };

  const openMergeDialog = (tag: ContentTagManagementItem) => {
    setMergeTargetValue("");
    setDialog({ type: "merge", tag });
  };

  const runAction = async (
    tag: ContentTagManagementItem,
    action: PendingAction,
    callback: () => Promise<TagActionResult>,
    onSuccess?: () => void,
  ) => {
    setPendingKey(`${tag.id}:${action}`);

    try {
      const result = await callback();

      if (result.success) {
        toast.success(result.message);
        setDialog(null);
        setMergeConfirmTag(null);
        onSuccess?.();
      } else {
        toast.error(result.message);
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong updating the tag.");
    } finally {
      setPendingKey(null);
    }
  };

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dialog?.type !== "rename") return;

    await runAction(dialog.tag, "rename", () => renameContentTag(dialog.tag.id, renameValue));
  };

  const handleMergeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dialog?.type !== "merge" || mergeTargetValue.trim().length === 0) return;

    const tag = dialog.tag;
    setDialog(null);
    setMergeConfirmTag(tag);
  };

  const togglePost = (tagId: string, postId: string) => {
    setSelectedByTag((current) => {
      const next = { ...current };
      const selected = new Set(next[tagId] ?? []);

      if (selected.has(postId)) {
        selected.delete(postId);
      } else {
        selected.add(postId);
      }

      next[tagId] = selected;
      return next;
    });
  };

  const toggleAllPosts = (tag: ContentTagManagementItem) => {
    setSelectedByTag((current) => {
      const next = { ...current };
      const selected = next[tag.id];
      const posts = tag.usage.posts;

      next[tag.id] = selected && selected.size === posts.length ? new Set() : new Set(posts.map((post) => post.id));

      return next;
    });
  };

  const clearTagSelection = (tagId: string) => {
    setSelectedByTag((current) => ({ ...current, [tagId]: new Set() }));
  };

  const isDialogOpen = dialog !== null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Tag Inventory</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          All shared content tags, their current post usage, and focused cleanup actions for selected assignments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Tags</CardTitle>
            <CardDescription>Shared records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.totalTags}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active</CardTitle>
            <CardDescription>Reviewed tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.activeTags}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs Review</CardTitle>
            <CardDescription>Cleanup queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.needsReviewTags}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post Usage</CardTitle>
            <CardDescription>Assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.postAssignments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shared Tags</CardTitle>
          <CardDescription>Posts are the only shared-tag content type currently adopted.</CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No shared content tags have been created yet.
            </div>
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-64">Tag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Usage</TableHead>
                    <TableHead className="min-w-80">Post Usage</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => {
                    const posts = tag.usage.posts;
                    const selectedPostIds = getSelectedPostIds(selectedByTag, tag.id);
                    const selectedCount = selectedPostIds.length;
                    const replacementName = replacementByTag[tag.id] ?? "";
                    const hasPosts = posts.length > 0;
                    const allPostsSelected = hasPosts && selectedCount === posts.length;

                    return (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <div className="flex min-w-64 flex-col gap-1">
                            <span className="font-medium">{tag.name}</span>
                            <span className="break-all font-mono text-xs text-muted-foreground">/{tag.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(tag.status)}>{formatStatus(tag.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{tag.totalUsageCount}</TableCell>
                        <TableCell>
                          {posts.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No post assignments</span>
                          ) : (
                            <div className="flex max-w-xl flex-col gap-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {selectedCount === 0
                                    ? `${posts.length} post assignment${posts.length === 1 ? "" : "s"}`
                                    : `${selectedCount} selected`}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isPending || !hasPosts}
                                  onClick={() => toggleAllPosts(tag)}
                                >
                                  {allPostsSelected ? "Clear Selection" : "Select All"}
                                </Button>
                              </div>
                              {posts.map((post) => (
                                <label
                                  key={post.id}
                                  className="flex min-w-0 cursor-pointer items-start gap-3 rounded-md border p-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedPostIds.includes(post.id)}
                                    disabled={isPending}
                                    onChange={() => togglePost(tag.id, post.id)}
                                    className="mt-1 size-4 accent-primary"
                                    aria-label={`Select ${post.title}`}
                                  />
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                      <Link
                                        href={`/admin/posts/${post.id}`}
                                        className="max-w-80 truncate font-medium underline-offset-4 hover:underline"
                                        title={post.title}
                                      >
                                        {post.title}
                                      </Link>
                                      <Badge variant={post.status === "published" ? "default" : "outline"}>
                                        {post.status}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      <span className="font-mono">/{post.slug}</span>
                                      <span>{formatDate(post.updatedAt)}</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                              <div className="grid gap-2 border-t pt-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isPending || selectedCount === 0}
                                  onClick={() => setDialog({ type: "remove", tag })}
                                >
                                  <Trash2 className="size-4" />
                                  Remove Selected
                                </Button>
                                <div className="space-y-1">
                                  <Label htmlFor={`inventory-replace-${tag.id}`} className="text-xs">
                                    Replacement tag
                                  </Label>
                                  <Input
                                    id={`inventory-replace-${tag.id}`}
                                    value={replacementName}
                                    disabled={isPending}
                                    placeholder="Replacement tag"
                                    onChange={(event) =>
                                      setReplacementByTag((current) => ({
                                        ...current,
                                        [tag.id]: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isPending || selectedCount === 0 || replacementName.trim().length === 0}
                                  onClick={() => setDialog({ type: "replace", tag })}
                                >
                                  <Tag className="size-4" />
                                  Replace
                                </Button>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                disabled={isPending}
                                aria-label={`Open actions for ${tag.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  openRenameDialog(tag);
                                }}
                              >
                                <Pencil className="size-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={tag.status === "ACTIVE"}
                                onSelect={(event) => {
                                  event.preventDefault();
                                  void runAction(tag, "mark-active", () => markContentTagReviewed(tag.id));
                                }}
                              >
                                <Check className="size-4" />
                                Mark Active
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={tag.status === "NEEDS_REVIEW"}
                                onSelect={(event) => {
                                  event.preventDefault();
                                  void runAction(tag, "mark-review", () => markContentTagNeedsReview(tag.id));
                                }}
                              >
                                <RotateCcw className="size-4" />
                                Needs Review
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  openMergeDialog(tag);
                                }}
                              >
                                <GitMerge className="size-4" />
                                Merge
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(event) => {
                                  event.preventDefault();
                                  setDialog({ type: "delete", tag });
                                }}
                              >
                                <Trash2 className="size-4" />
                                Delete Unused
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {isPending ? <div className="text-sm text-muted-foreground">Applying tag action...</div> : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen && (dialog?.type === "rename" || dialog?.type === "merge")}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setDialog(null);
            setMergeConfirmTag(null);
          }
        }}
      >
        {dialog?.type === "rename" ? (
          <DialogContent>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Rename Tag</DialogTitle>
                <DialogDescription>
                  Assignments stay attached to this shared tag. The saved slug is normalized from the new name.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor={`rename-${dialog.tag.id}`}>Tag name</Label>
                <Input
                  id={`rename-${dialog.tag.id}`}
                  value={renameValue}
                  disabled={isPending}
                  onChange={(event) => setRenameValue(event.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || renameValue.trim().length === 0}>
                  Rename
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : null}

        {dialog?.type === "merge" ? (
          <DialogContent>
            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Merge Tag</DialogTitle>
                <DialogDescription>
                  Move supported assignments from &quot;{dialog.tag.name}&quot; into a target tag, then remove the
                  source tag.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor={`merge-${dialog.tag.id}`}>Target tag name</Label>
                <Input
                  id={`merge-${dialog.tag.id}`}
                  value={mergeTargetValue}
                  disabled={isPending}
                  placeholder="Target tag"
                  onChange={(event) => setMergeTargetValue(event.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || mergeTargetValue.trim().length === 0}>
                  Review Merge
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={mergeConfirmTag !== null}
        onOpenChange={(open) => {
          if (!open) setMergeConfirmTag(null);
        }}
        title={mergeConfirmTag ? `Merge "${mergeConfirmTag.name}"?` : "Merge tag?"}
        description={`Assignments will move to "${mergeTargetValue.trim()}"; duplicate post assignments will be skipped and the source tag will be removed.`}
        confirmLabel="Merge Tag"
        isPending={pendingKey === `${mergeConfirmTag?.id}:merge`}
        onConfirm={() => {
          if (!mergeConfirmTag) return;
          return runAction(mergeConfirmTag, "merge", () => mergeContentTag(mergeConfirmTag.id, mergeTargetValue));
        }}
      />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog?.type === "delete" ? `Delete "${dialog.tag.name}"?` : "Delete unused tag?"}
        description={
          dialog?.type === "delete" && dialog.tag.totalUsageCount > 0
            ? "This tag still has assignments. The server will reject direct deletion and ask you to merge or remove assignments first."
            : "Only tags with no supported assignments can be deleted."
        }
        confirmLabel="Delete Unused"
        confirmVariant="destructive"
        isPending={dialog?.type === "delete" && pendingKey === `${dialog.tag.id}:delete`}
        onConfirm={() => {
          if (dialog?.type !== "delete") return;
          return runAction(dialog.tag, "delete", () => deleteUnusedContentTag(dialog.tag.id));
        }}
      />

      <ConfirmDialog
        open={dialog?.type === "remove"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog?.type === "remove" ? `Remove "${dialog.tag.name}" from selected posts?` : "Remove assignments?"}
        description={
          dialog?.type === "remove"
            ? `This will remove ${getSelectedPostIds(selectedByTag, dialog.tag.id).length} selected assignment${
                getSelectedPostIds(selectedByTag, dialog.tag.id).length === 1 ? "" : "s"
              } without deleting posts.`
            : "Selected assignments will be removed without deleting posts."
        }
        confirmLabel="Remove Selected"
        confirmVariant="destructive"
        isPending={dialog?.type === "remove" && pendingKey === `${dialog.tag.id}:remove`}
        onConfirm={() => {
          if (dialog?.type !== "remove") return;

          const tag = dialog.tag;
          const selectedPostIds = getSelectedPostIds(selectedByTag, tag.id);

          return runAction(
            tag,
            "remove",
            () => removeContentTagAssignments(tag.id, selectedPostIds),
            () => clearTagSelection(tag.id),
          );
        }}
      />

      <ConfirmDialog
        open={dialog?.type === "replace"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialog?.type === "replace" ? `Replace "${dialog.tag.name}" on selected posts?` : "Replace assignments?"}
        description={
          dialog?.type === "replace"
            ? `This will assign "${(replacementByTag[dialog.tag.id] ?? "").trim()}" to ${
                getSelectedPostIds(selectedByTag, dialog.tag.id).length
              } selected post${getSelectedPostIds(selectedByTag, dialog.tag.id).length === 1 ? "" : "s"} and remove the original assignments.`
            : "Selected assignments will be replaced with the chosen tag."
        }
        confirmLabel="Replace Selected"
        isPending={dialog?.type === "replace" && pendingKey === `${dialog.tag.id}:replace`}
        onConfirm={() => {
          if (dialog?.type !== "replace") return;

          const tag = dialog.tag;
          const selectedPostIds = getSelectedPostIds(selectedByTag, tag.id);
          const replacementName = replacementByTag[tag.id] ?? "";

          return runAction(
            tag,
            "replace",
            () => replaceContentTagAssignments(tag.id, selectedPostIds, replacementName),
            () => {
              clearTagSelection(tag.id);
              setReplacementByTag((current) => ({ ...current, [tag.id]: "" }));
            },
          );
        }}
      />
    </section>
  );
};

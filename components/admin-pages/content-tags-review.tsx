"use client";

import { Check, GitMerge, RotateCcw, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  markContentTagNeedsReview,
  markContentTagReviewed,
  mergeContentTag,
  removeContentTagAssignments,
  replaceContentTagAssignments,
} from "@/app/_actions/content-tags";
import type { ContentTagReviewItem } from "@/app/_data/content-tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ContentTagsReviewProps = {
  tags: ContentTagReviewItem[];
};

type PendingAction = "approve" | "flag" | "remove" | "replace" | "merge";

const formatDate = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getSelectedPostIds = (selectedByTag: Record<string, Set<string>>, tagId: string) =>
  Array.from(selectedByTag[tagId] ?? []);

export const ContentTagsReview = ({ tags }: ContentTagsReviewProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [selectedByTag, setSelectedByTag] = useState<Record<string, Set<string>>>({});
  const [replacementByTag, setReplacementByTag] = useState<Record<string, string>>({});
  const [mergeTargetByTag, setMergeTargetByTag] = useState<Record<string, string>>({});

  const totalPostAssignments = useMemo(() => tags.reduce((total, tag) => total + tag.postCount, 0), [tags]);

  const runAction = (
    tagId: string,
    action: PendingAction,
    callback: () => Promise<{ success: boolean; message: string }>,
  ) => {
    setPendingKey(`${tagId}:${action}`);

    startTransition(async () => {
      try {
        const result = await callback();

        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }

        router.refresh();
      } catch {
        toast.error("Something went wrong updating the tag.");
      } finally {
        setPendingKey(null);
      }
    });
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

  const toggleAllPosts = (tag: ContentTagReviewItem) => {
    setSelectedByTag((current) => {
      const next = { ...current };
      const selected = next[tag.id];

      next[tag.id] =
        selected && selected.size === tag.posts.length ? new Set() : new Set(tag.posts.map((post) => post.id));

      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs Review</CardTitle>
            <CardDescription>Shared content tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{tags.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linked Posts</CardTitle>
            <CardDescription>Current shared assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{totalPostAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Scope</CardTitle>
            <CardDescription>Public display is unchanged</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Admin cleanup only</Badge>
          </CardContent>
        </Card>
      </section>

      {tags.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tags need review</CardTitle>
            <CardDescription>The cleanup queue is empty.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="flex flex-col gap-4">
          {tags.map((tag) => {
            const selectedPostIds = getSelectedPostIds(selectedByTag, tag.id);
            const replacementName = replacementByTag[tag.id] ?? "";
            const mergeTargetName = mergeTargetByTag[tag.id] ?? "";
            const hasPosts = tag.posts.length > 0;
            const allPostsSelected = hasPosts && selectedPostIds.length === tag.posts.length;

            return (
              <Card key={tag.id}>
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{tag.name}</CardTitle>
                        <Badge variant="secondary">{tag.status}</Badge>
                        <Badge variant="outline">{tag.postCount} posts</Badge>
                      </div>
                      <CardDescription className="break-all font-mono">/{tag.slug}</CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => runAction(tag.id, "approve", () => markContentTagReviewed(tag.id))}
                      >
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => runAction(tag.id, "flag", () => markContentTagNeedsReview(tag.id))}
                      >
                        <RotateCcw className="size-4" />
                        Keep Flagged
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-medium">Post Usage</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!hasPosts}
                        onClick={() => toggleAllPosts(tag)}
                      >
                        {allPostsSelected ? "Clear Selection" : "Select All"}
                      </Button>
                    </div>

                    {hasPosts ? (
                      <div className="overflow-hidden rounded-md border">
                        {tag.posts.map((post) => {
                          const checked = selectedPostIds.includes(post.id);

                          return (
                            <label
                              key={post.id}
                              className="flex cursor-pointer flex-col gap-2 border-b p-3 last:border-b-0 md:flex-row md:items-center md:justify-between"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePost(tag.id, post.id)}
                                  className="mt-1 size-4 accent-primary"
                                  aria-label={`Select ${post.title}`}
                                />
                                <div className="min-w-0 space-y-1">
                                  <a
                                    href={`/admin/posts/${post.id}`}
                                    className="block truncate font-medium underline-offset-4 hover:underline"
                                    title={post.title}
                                  >
                                    {post.title}
                                  </a>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono">/{post.slug}</span>
                                    <span>{formatDate(post.updatedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant={post.status === "published" ? "default" : "outline"}>{post.status}</Badge>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-md border p-4 text-sm text-muted-foreground">
                        This tag has no linked post assignments.
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Trash2 className="size-4" />
                        Remove
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending || selectedPostIds.length === 0}
                        onClick={() =>
                          runAction(tag.id, "remove", () => removeContentTagAssignments(tag.id, selectedPostIds))
                        }
                      >
                        Remove Selected
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`replace-${tag.id}`} className="flex items-center gap-2">
                        <Tag className="size-4" />
                        Replace Selected
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id={`replace-${tag.id}`}
                          value={replacementName}
                          placeholder="Replacement tag"
                          onChange={(event) =>
                            setReplacementByTag((current) => ({ ...current, [tag.id]: event.target.value }))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending || selectedPostIds.length === 0 || replacementName.trim().length === 0}
                          onClick={() =>
                            runAction(tag.id, "replace", () =>
                              replaceContentTagAssignments(tag.id, selectedPostIds, replacementName),
                            )
                          }
                        >
                          Replace
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`merge-${tag.id}`} className="flex items-center gap-2">
                        <GitMerge className="size-4" />
                        Merge Tag
                      </Label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id={`merge-${tag.id}`}
                          value={mergeTargetName}
                          placeholder="Target tag"
                          onChange={(event) =>
                            setMergeTargetByTag((current) => ({ ...current, [tag.id]: event.target.value }))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending || mergeTargetName.trim().length === 0}
                          onClick={() => runAction(tag.id, "merge", () => mergeContentTag(tag.id, mergeTargetName))}
                        >
                          Merge
                        </Button>
                      </div>
                    </div>
                  </div>

                  {pendingKey?.startsWith(`${tag.id}:`) ? (
                    <div className="text-sm text-muted-foreground">Applying action...</div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
};

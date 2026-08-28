"use client";

import { DatabaseZap, Play, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  applySelectedLegacyPostTagMigration,
  dryRunLegacyPostTagMigration,
  dryRunSelectedLegacyPostTagMigration,
  type LegacyPostTagInventoryResult,
} from "@/app/_data/content-tags-legacy-migration";
import type { LegacyPostTagMigrationSummary } from "@/lib/content-tags-legacy-migration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

type TagsLegacyMigrationPanelProps = {
  inventory: LegacyPostTagInventoryResult;
};

const SummaryLines = ({ summary }: { summary: LegacyPostTagMigrationSummary }) => (
  <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
    <div>
      <dt className="text-muted-foreground">Mode</dt>
      <dd className="font-medium">{summary.mode}</dd>
    </div>
    {summary.selectedPosts != null ? (
      <div>
        <dt className="text-muted-foreground">Selected posts</dt>
        <dd className="font-medium">{summary.selectedPosts}</dd>
      </div>
    ) : null}
    <div>
      <dt className="text-muted-foreground">Eligible posts</dt>
      <dd className="font-medium">{summary.eligiblePosts}</dd>
    </div>
    {summary.postsSkippedIneligible != null ? (
      <div>
        <dt className="text-muted-foreground">No longer eligible</dt>
        <dd className="font-medium">{summary.postsSkippedIneligible}</dd>
      </div>
    ) : null}
    <div>
      <dt className="text-muted-foreground">Assignments</dt>
      <dd className="font-medium">{summary.plannedAssignments}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground">New tags</dt>
      <dd className="font-medium">{summary.tagsToCreate}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground">Reused tags</dt>
      <dd className="font-medium">{summary.tagsToReuse}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground">Skipped values</dt>
      <dd className="font-medium">{summary.valuesSkipped}</dd>
    </div>
    <div>
      <dt className="text-muted-foreground">No valid tags</dt>
      <dd className="font-medium">{summary.postsSkippedNoValidTags}</dd>
    </div>
    {summary.postsMigrated != null ? (
      <div>
        <dt className="text-muted-foreground">Posts migrated</dt>
        <dd className="font-medium">{summary.postsMigrated}</dd>
      </div>
    ) : null}
  </dl>
);

export const TagsLegacyMigrationPanel = ({ inventory }: TagsLegacyMigrationPanelProps) => {
  const router = useRouter();
  const [summary, setSummary] = useState<LegacyPostTagMigrationSummary | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasEligible = inventory.eligiblePosts > 0;
  const eligiblePostRows = inventory.eligiblePostRows;
  const eligibleIdSet = useMemo(() => new Set(eligiblePostRows.map((post) => post.id)), [eligiblePostRows]);
  const visibleSelectedIds = useMemo(
    () => selectedPostIds.filter((id) => eligibleIdSet.has(id)),
    [eligibleIdSet, selectedPostIds],
  );
  const selectedCount = visibleSelectedIds.length;
  const allVisibleSelected = hasEligible && selectedCount === eligiblePostRows.length;
  const inventoryNote = useMemo(() => {
    if (!hasEligible) return "No legacy-only posts remain.";
    return `${inventory.eligiblePosts} post(s) still rely on legacy Post.tags, with ${inventory.uniqueRawValues} unique raw value(s).`;
  }, [hasEligible, inventory.eligiblePosts, inventory.uniqueRawValues]);

  const togglePost = (postId: string) => {
    setSelectedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    );
  };

  const selectAllVisible = () => {
    setSelectedPostIds(eligiblePostRows.map((post) => post.id));
  };

  const clearSelection = () => {
    setSelectedPostIds([]);
  };

  const runSelectedDryRun = () => {
    startTransition(async () => {
      try {
        const result = await dryRunSelectedLegacyPostTagMigration(visibleSelectedIds);
        setSummary(result.summary);
        toast.success("Selected dry-run complete");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Selected dry-run failed");
      }
    });
  };

  const runDryRun = () => {
    startTransition(async () => {
      try {
        const result = await dryRunLegacyPostTagMigration();
        setSummary(result.summary);
        toast.success("Dry-run complete");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Dry-run failed");
      }
    });
  };

  const runSelectedApply = () => {
    setIsConfirmOpen(false);
    startTransition(async () => {
      try {
        const result = await applySelectedLegacyPostTagMigration(visibleSelectedIds);
        setSummary(result.summary);
        toast.success("Selected legacy tags imported for review");
        clearSelection();
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Selected import failed");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">Legacy Post Tags</CardTitle>
              <Badge variant={hasEligible ? "secondary" : "outline"}>
                {hasEligible ? "Import available" : "Clear"}
              </Badge>
            </div>
            <CardDescription>{inventoryNote}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="font-medium">Eligible posts</div>
              <p className="text-sm text-muted-foreground">
                {selectedCount} of {eligiblePostRows.length} post(s) selected. Selecting a post plans all of its valid
                legacy tags together.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={!hasEligible} onClick={selectAllVisible}>
                Select All Visible
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={selectedCount === 0} onClick={clearSelection}>
                Clear
              </Button>
              <Button type="button" disabled={isPending || selectedCount === 0} onClick={runSelectedDryRun}>
                <Play className="size-4" />
                Dry Run Selected
              </Button>
              <Button type="button" disabled={isPending || selectedCount === 0} onClick={() => setIsConfirmOpen(true)}>
                <UploadCloud className="size-4" />
                Import Selected
              </Button>
            </div>
          </div>

          {eligiblePostRows.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = selectedCount > 0 && !allVisibleSelected;
                          }
                        }}
                        onChange={() => {
                          if (allVisibleSelected) {
                            clearSelection();
                            return;
                          }

                          selectAllVisible();
                        }}
                        className="size-4 accent-primary"
                        aria-label="Select all visible posts"
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">Post</th>
                    <th className="px-3 py-2 font-medium">Legacy values</th>
                    <th className="px-3 py-2 font-medium">Planned shared tags</th>
                    <th className="px-3 py-2 font-medium">Skipped</th>
                  </tr>
                </thead>
                <tbody>
                  {eligiblePostRows.map((post) => {
                    const checked = visibleSelectedIds.includes(post.id);

                    return (
                      <tr key={post.id} className="border-t">
                        <td className="px-3 py-2 align-top">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePost(post.id)}
                            className="mt-1 size-4 accent-primary"
                            aria-label={`Select ${post.title}`}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <a
                            href={`/admin/posts/${post.id}`}
                            className="block font-medium underline-offset-4 hover:underline"
                            title={post.title}
                          >
                            {post.title}
                          </a>
                          <div className="font-mono text-xs text-muted-foreground">/{post.slug}</div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {post.rawValues.map((value, index) => (
                              <Badge key={`${post.id}-raw-${value}-${index}`} variant="outline" className="font-mono">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {post.plannedTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {post.plannedTags.map((tag) => (
                                <Badge key={tag.slug} variant="secondary" title={tag.slug}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {post.skippedValues.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {post.skippedValues.map((value, index) => (
                                <Badge key={`${post.id}-skipped-${value}-${index}`} variant="destructive">
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border p-4 text-sm text-muted-foreground">
              <DatabaseZap className="size-4" />
              No eligible legacy-only posts to select.
            </div>
          )}
        </div>

        {inventory.rows.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="font-medium">Raw-value inventory</div>
              <p className="text-sm text-muted-foreground">
                Broad cleanup context for unique legacy values. It does not replace post selection for dry-run planning.
              </p>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 font-medium">Raw value</th>
                    <th className="px-3 py-2 font-medium">Count</th>
                    <th className="px-3 py-2 font-medium">Suggested slug</th>
                    <th className="px-3 py-2 font-medium">Sample posts</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.rows.map((row) => (
                    <tr key={row.rawValue} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{row.rawValue}</td>
                      <td className="px-3 py-2">{row.count}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.suggestedSlug || "invalid"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          {row.samplePosts.map((post) => (
                            <a
                              key={post.id}
                              href={`/admin/posts/${post.id}`}
                              className="truncate underline-offset-4 hover:text-foreground hover:underline"
                              title={post.title}
                            >
                              {post.title}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border p-4 text-sm text-muted-foreground">
            <DatabaseZap className="size-4" />
            Legacy-only post tag inventory is empty.
          </div>
        )}

        <div className="space-y-3 rounded-md border border-dashed bg-muted/10 p-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">All eligible posts</div>
            <p className="text-sm text-muted-foreground">
              Optional broad dry-run for every eligible post. Import always applies only to the selected posts above.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={isPending || !hasEligible} onClick={runDryRun}>
              <Play className="size-4" />
              Dry Run All
            </Button>
          </div>
        </div>

        {summary ? (
          <div className="rounded-md border bg-muted/20 p-4">
            <SummaryLines summary={summary} />
          </div>
        ) : null}
      </CardContent>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Import selected legacy post tags?"
        description={`${selectedCount} selected post(s) will receive shared tags marked as needs review. Public tag display will remain unchanged.`}
        confirmLabel="Import Selected"
        isPending={isPending}
        onConfirm={runSelectedApply}
      />
    </Card>
  );
};

"use client";

import { DatabaseZap, Play, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  applyLegacyPostTagMigration,
  dryRunLegacyPostTagMigration,
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
    <div>
      <dt className="text-muted-foreground">Eligible posts</dt>
      <dd className="font-medium">{summary.eligiblePosts}</dd>
    </div>
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasEligible = inventory.eligiblePosts > 0;
  const inventoryNote = useMemo(() => {
    if (!hasEligible) return "No legacy-only posts remain.";
    return `${inventory.eligiblePosts} post(s) still rely on legacy Post.tags, with ${inventory.uniqueRawValues} unique raw value(s).`;
  }, [hasEligible, inventory.eligiblePosts, inventory.uniqueRawValues]);

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

  const runApply = () => {
    setIsConfirmOpen(false);
    startTransition(async () => {
      try {
        const result = await applyLegacyPostTagMigration();
        setSummary(result.summary);
        toast.success("Legacy tags imported for review");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Import failed");
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={isPending || !hasEligible} onClick={runDryRun}>
              <Play className="size-4" />
              Dry Run
            </Button>
            <Button type="button" disabled={isPending || !hasEligible} onClick={() => setIsConfirmOpen(true)}>
              <UploadCloud className="size-4" />
              Import
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {inventory.rows.length > 0 ? (
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
        ) : (
          <div className="flex items-center gap-3 rounded-md border p-4 text-sm text-muted-foreground">
            <DatabaseZap className="size-4" />
            Legacy-only post tag inventory is empty.
          </div>
        )}

        {summary ? (
          <div className="rounded-md border bg-muted/20 p-4">
            <SummaryLines summary={summary} />
          </div>
        ) : null}
      </CardContent>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Import legacy post tags?"
        description="Eligible legacy post tags will become shared tags that need review. Public tag display will remain unchanged."
        confirmLabel="Import Tags"
        isPending={isPending}
        onConfirm={runApply}
      />
    </Card>
  );
};

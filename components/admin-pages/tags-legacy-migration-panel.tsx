"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { toast } from "sonner";

import {
  applyLegacyPostTagMigration,
  dryRunLegacyPostTagMigration,
  type LegacyPostTagInventoryResult,
} from "@/app/_data/content-tags-legacy-migration";
import type { LegacyPostTagMigrationPolicy, LegacyPostTagMigrationSummary } from "@/lib/content-tags-legacy-migration";
import { Badge, Button, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from "@/components/index";

type TagsLegacyMigrationPanelProps = {
  inventory: LegacyPostTagInventoryResult;
};

const parsePolicy = (dropText: string, renameText: string): LegacyPostTagMigrationPolicy => {
  const drop = dropText
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  let renameBySlug: LegacyPostTagMigrationPolicy["renameBySlug"];
  const renameTrimmed = renameText.trim();
  if (renameTrimmed) {
    const parsed = JSON.parse(renameTrimmed) as Record<string, { name: string; slug?: string } | string>;
    renameBySlug = {};
    Object.entries(parsed).forEach(([sourceSlug, target]) => {
      if (typeof target === "string") {
        renameBySlug![sourceSlug] = { name: target };
      } else if (target && typeof target === "object" && typeof target.name === "string") {
        renameBySlug![sourceSlug] = target;
      }
    });
  }

  return {
    drop: drop.length > 0 ? drop : undefined,
    renameBySlug,
  };
};

const SummaryLines = ({ summary }: { summary: LegacyPostTagMigrationSummary }) => (
  <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
    <li>Mode: {summary.mode}</li>
    <li>Eligible posts: {summary.eligiblePosts}</li>
    <li>Assignments planned: {summary.plannedAssignments}</li>
    <li>Tags to create: {summary.tagsToCreate}</li>
    <li>Tag reuse hits: {summary.tagsToReuse}</li>
    <li>Values dropped: {summary.valuesDropped}</li>
    <li>Empty after policy: {summary.postsSkippedEmptyAfterPolicy}</li>
    {summary.postsMigrated != null ? <li>Posts migrated: {summary.postsMigrated}</li> : null}
  </ul>
);

export const TagsLegacyMigrationPanel = ({ inventory }: TagsLegacyMigrationPanelProps) => {
  const [dropText, setDropText] = useState("");
  const [renameText, setRenameText] = useState("");
  const [summary, setSummary] = useState<LegacyPostTagMigrationSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasEligible = inventory.eligiblePosts > 0;

  const inventoryNote = useMemo(() => {
    if (!hasEligible) return "No legacy-only posts remain. Migration is a no-op until more appear.";
    return `${inventory.eligiblePosts} post(s) still use only Post.tags; ${inventory.uniqueRawValues} unique raw value(s).`;
  }, [hasEligible, inventory.eligiblePosts, inventory.uniqueRawValues]);

  const runWithPolicy = (mode: "dry-run" | "apply") => {
    startTransition(async () => {
      try {
        const policy = parsePolicy(dropText, renameText);

        if (mode === "apply") {
          const confirmed = window.confirm(
            "Apply legacy post-tag migration for all eligible posts? This creates shared tags and assignments.",
          );
          if (!confirmed) return;

          const result = await applyLegacyPostTagMigration(policy);
          setSummary(result.summary);
          toast.success("Legacy tag migration applied");
          // Refresh inventory by reloading the page
          window.location.reload();
          return;
        }

        const result = await dryRunLegacyPostTagMigration(policy);
        setSummary(result.summary);
        toast.success("Dry-run complete");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Migration action failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{hasEligible ? "Migration available" : "Nothing to migrate"}</Badge>
        <p className="text-sm text-muted-foreground">{inventoryNote}</p>
      </div>

      {inventory.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[40rem] text-left text-sm">
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
                  <td className="px-3 py-2 font-mono text-xs">{row.suggestedSlug || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.samplePostSlugs.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="legacy-tag-drop">Drop values (optional, one per line)</Label>
          <Textarea
            id="legacy-tag-drop"
            value={dropText}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDropText(event.target.value)}
            placeholder={"junk\nold-tag"}
            rows={5}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legacy-tag-rename">Rename map JSON (optional)</Label>
          <Textarea
            id="legacy-tag-rename"
            value={renameText}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setRenameText(event.target.value)}
            placeholder={'{\n  "old-slug": { "name": "Preferred Name" }\n}'}
            rows={5}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">Keys are source slugs. Leave empty to skip renames.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !hasEligible}
          onClick={() => runWithPolicy("dry-run")}
        >
          Dry run
        </Button>
        <Button type="button" disabled={isPending || !hasEligible} onClick={() => runWithPolicy("apply")}>
          Apply migration
        </Button>
      </div>

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last run summary</CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryLines summary={summary} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

import Link from "next/link";

import type { ContentTagManagementItem } from "@/app/_data/content-tags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export const ContentTagsInventory = ({ tags, summary }: ContentTagsInventoryProps) => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Tag Inventory</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          All shared content tags and their current post usage. Broad management actions are handled in later slices.
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-64">Tag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead className="min-w-80">Post Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => {
                  const posts = tag.usage.posts;

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
                          <div className="flex max-w-xl flex-col gap-2">
                            {posts.map((post) => (
                              <div key={post.id} className="flex min-w-0 flex-col gap-1">
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
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

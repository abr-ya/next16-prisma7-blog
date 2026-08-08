import { Tags } from "lucide-react";

import { getLegacyPostTagInventory } from "@/app/_data/content-tags-legacy-migration";
import { TagsLegacyMigrationPanel } from "@/components/admin-pages/tags-legacy-migration-panel";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Tags", to: null },
];

const AdminTagsPage = async () => {
  await requireAdmin();
  const inventory = await getLegacyPostTagInventory();

  return (
    <AdminPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-4">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tags className="size-5 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Tags</h1>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Shared content tags for posts. This page is the admin home for tags: management tools come later; legacy
                post-tag cleanup is available now.
              </p>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shared tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Listing, rename, merge, detach, and usage visibility for existing shared tags are not available yet. That
              work is planned as <span className="font-medium text-foreground">feature-031</span>.
            </p>
            <p>Until then, posts pick shared tags when you edit and save them in the post form.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legacy post-tag migration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Posts that still only have string tags in <code className="text-xs">Post.tags</code> (no shared
              assignments) can be migrated here. Use dry-run first, then apply. Re-runs only process remaining
              legacy-only posts.
            </p>
            <TagsLegacyMigrationPanel inventory={inventory} />
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminTagsPage;

import { ContentTagStatus } from "@/generated/prisma/client";

import { getAdminContentTagsByStatus } from "@/app/_data/content-tags";
import { getLegacyPostTagInventory } from "@/app/_data/content-tags-legacy-migration";
import { ContentTagsReview } from "@/components/admin-pages/content-tags-review";
import { TagsLegacyMigrationPanel } from "@/components/admin-pages/tags-legacy-migration-panel";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { requireAdmin } from "@/lib/auth-utils";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Content Tags", to: null },
];

const AdminContentTagsPage = async () => {
  await requireAdmin();

  const [needsReviewTags, legacyInventory] = await Promise.all([
    getAdminContentTagsByStatus(ContentTagStatus.NEEDS_REVIEW),
    getLegacyPostTagInventory(),
  ]);

  return (
    <AdminPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Content Tags</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Import legacy post tags into the shared tag review queue, then clean up shared content tags that need admin
            attention.
          </p>
        </div>
        <TagsLegacyMigrationPanel inventory={legacyInventory} />
        <ContentTagsReview tags={needsReviewTags} />
      </div>
    </AdminPageLayout>
  );
};

export default AdminContentTagsPage;

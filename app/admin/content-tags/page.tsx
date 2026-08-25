import { ContentTagStatus } from "@/generated/prisma/client";

import { getAdminContentTagManagementItems, getAdminContentTagsByStatus } from "@/app/_data/content-tags";
import { getLegacyPostTagInventory } from "@/app/_data/content-tags-legacy-migration";
import { ContentTagsInventory } from "@/components/admin-pages/content-tags-inventory";
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

  const [managementItems, needsReviewTags, legacyInventory] = await Promise.all([
    getAdminContentTagManagementItems(),
    getAdminContentTagsByStatus(ContentTagStatus.NEEDS_REVIEW),
    getLegacyPostTagInventory(),
  ]);

  const inventorySummary = {
    totalTags: managementItems.length,
    activeTags: managementItems.filter((tag) => tag.status === ContentTagStatus.ACTIVE).length,
    needsReviewTags: managementItems.filter((tag) => tag.status === ContentTagStatus.NEEDS_REVIEW).length,
    postAssignments: managementItems.reduce((total, tag) => total + tag.usage.posts.length, 0),
  };

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
        <ContentTagsInventory tags={managementItems} summary={inventorySummary} />
        <TagsLegacyMigrationPanel inventory={legacyInventory} />
        <ContentTagsReview tags={needsReviewTags} />
      </div>
    </AdminPageLayout>
  );
};

export default AdminContentTagsPage;

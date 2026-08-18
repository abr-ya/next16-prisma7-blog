import { ContentTagStatus } from "@/generated/prisma/client";

import { getAdminContentTagsByStatus } from "@/app/_data/content-tags";
import { ContentTagsReview } from "@/components/admin-pages/content-tags-review";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { requireAdmin } from "@/lib/auth-utils";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Content Tags", to: null },
];

const AdminContentTagsPage = async () => {
  await requireAdmin();

  const needsReviewTags = await getAdminContentTagsByStatus(ContentTagStatus.NEEDS_REVIEW);

  return (
    <AdminPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Content Tags Review</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Review shared content tags that are still public and assigned, but need admin cleanup.
          </p>
        </div>
        <ContentTagsReview tags={needsReviewTags} />
      </div>
    </AdminPageLayout>
  );
};

export default AdminContentTagsPage;

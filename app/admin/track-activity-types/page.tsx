import { getAdminTrackActivityTypes } from "@/app/_data/track-activity-types";
import { TrackActivityTypesAdminPanel } from "@/components/admin-pages/track-activity-types-admin-panel";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { requireAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function TrackActivityTypesPage() {
  await requireAdmin();
  const activityTypes = await getAdminTrackActivityTypes();
  return (
    <AdminPageLayout
      breadcrumbs={[
        { label: "Dashboard", to: "/admin" },
        { label: "Track activity types", to: null },
      ]}
    >
      <TrackActivityTypesAdminPanel activityTypes={activityTypes} />
    </AdminPageLayout>
  );
}

import { getAllTracks } from "@/app/_data/tracks";
import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { TracksAdminPanel } from "@/components/admin-pages/tracks-admin-panel";
import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const TracksPage = async () => {
  const [tracks, activityTypes] = await Promise.all([getAllTracks(), getActiveTrackActivityTypes()]);
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Tracks", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <TracksAdminPanel tracks={tracks} activityTypes={activityTypes} />
    </AdminPageLayout>
  );
};

export default TracksPage;

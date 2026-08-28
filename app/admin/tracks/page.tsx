import { getAllTracks } from "@/app/_data/tracks";
import { TracksAdminPanel } from "@/components/admin-pages/tracks-admin-panel";
import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const TracksPage = async () => {
  const tracks = await getAllTracks();
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Tracks", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <TracksAdminPanel tracks={tracks} />
    </AdminPageLayout>
  );
};

export default TracksPage;

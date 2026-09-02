import { getAllHikes } from "@/app/_data/hikes";
import { getAllTracks } from "@/app/_data/tracks";
import { HikesAdminPanel } from "@/components/admin-pages/hikes-admin-panel";
import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const HikesPage = async () => {
  const [hikes, tracks] = await Promise.all([getAllHikes(), getAllTracks()]);
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Hikes", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <HikesAdminPanel hikes={hikes} tracks={tracks} />
    </AdminPageLayout>
  );
};

export default HikesPage;

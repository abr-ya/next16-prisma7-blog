import { getAllHikes, getHikePhotoOptions } from "@/app/_data/hikes";
import { getAllTracks } from "@/app/_data/tracks";
import { HikesAdminPanel } from "@/components/admin-pages/hikes-admin-panel";
import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const HikesPage = async () => {
  const [hikes, tracks, photos] = await Promise.all([getAllHikes(), getAllTracks(), getHikePhotoOptions()]);
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Hikes", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <HikesAdminPanel hikes={hikes} tracks={tracks} photos={photos} />
    </AdminPageLayout>
  );
};

export default HikesPage;

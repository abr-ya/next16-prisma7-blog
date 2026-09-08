import { getAllHikes, getHikePhotoOptions } from "@/app/_data/hikes";
import { getAllTracks } from "@/app/_data/tracks";
import { HikesAdminPanel } from "@/components/admin-pages/hikes-admin-panel";
import { AdminPageLayout } from "@/components/index";
import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const TripsAdminPage = async () => {
  const [hikes, tracks, photos] = await Promise.all([getAllHikes(), getAllTracks(), getHikePhotoOptions()]);
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Trips", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <HikesAdminPanel hikes={hikes} tracks={tracks} photos={photos} />
    </AdminPageLayout>
  );
};

export default function LegacyHikesAdminPage() {
  permanentRedirect("/admin/trips");
}

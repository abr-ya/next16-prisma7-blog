import { getAllHikes, getHikePhotoOptions } from "@/app/_data/hikes";
import { getAllTracks } from "@/app/_data/tracks";
import { HikesAdminPanel } from "@/components/admin-pages/hikes-admin-panel";
import { AdminPageLayout } from "@/components/index";
import { currentUserRole } from "@/lib/auth-utils";
import { hasAdminRole } from "@/lib/auth-roles";
import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const TripsAdminPage = async () => {
  const [hikes, tracks, role] = await Promise.all([getAllHikes(), getAllTracks(), currentUserRole()]);
  const isAdmin = hasAdminRole(role);
  const photos = isAdmin ? await getHikePhotoOptions() : [];
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Trips", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <HikesAdminPanel hikes={hikes} tracks={tracks} photos={photos} isAdmin={isAdmin} />
    </AdminPageLayout>
  );
};

export default function LegacyHikesAdminPage() {
  permanentRedirect("/admin/trips");
}

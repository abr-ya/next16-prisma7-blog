import { getAllHikes } from "@/app/_data/hikes";
import { HikesAdminPanel } from "@/components/admin-pages/hikes-admin-panel";
import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const HikesPage = async () => {
  const hikes = await getAllHikes();
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Hikes", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <HikesAdminPanel hikes={hikes} />
    </AdminPageLayout>
  );
};

export default HikesPage;

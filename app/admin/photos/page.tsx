import { listPhotos } from "@/app/_data/photos";
import { PhotosAdminPanel } from "@/components/admin-pages/photos-admin-panel";
import { AdminPageLayout } from "@/components/index";

export const dynamic = "force-dynamic";

const PhotosPage = async () => {
  const photos = await listPhotos();
  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Photos", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems}>
      <PhotosAdminPanel photos={photos} />
    </AdminPageLayout>
  );
};

export default PhotosPage;

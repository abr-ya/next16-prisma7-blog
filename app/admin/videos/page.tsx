import Link from "next/link";

import { getAllVideos } from "@/app/_data/videos";
import { AdminPageLayout, Button, VideosTable } from "@/components/index";

export const dynamic = "force-dynamic";

const VideosPage = async () => {
  const videos = await getAllVideos();

  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Videos", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <Link href="/admin/videos/new">
          <Button className="cursor-pointer">Add video</Button>
        </Link>
      }
    >
      <VideosTable data={videos} />
    </AdminPageLayout>
  );
};

export default VideosPage;

import Link from "next/link";

import { getAllVideos } from "@/app/_data/videos";
import { AdminPageLayout, Button } from "@/components/index";

export const dynamic = "force-dynamic";

const VideosPage = async () => {
  const videos = await getAllVideos();

  const breadItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Videos", to: null },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={breadItems}
      headerRight={
        <Link href="/videos/new">
          <Button className="cursor-pointer">Add video</Button>
        </Link>
      }
    >
      <div className="p-4">
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          Videos table placeholder. Saved videos: {videos.length}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default VideosPage;

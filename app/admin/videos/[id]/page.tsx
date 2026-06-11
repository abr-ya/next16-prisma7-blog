import { notFound } from "next/navigation";

import { getVideoById } from "@/app/_data/videos";
import { AdminPageLayout, VideoForm } from "@/components/index";

const VideoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const video =
    id === "new"
      ? {
          id: "",
          title: "",
          url: "",
          videoDate: new Date(),
          visibility: "PRIVATE" as const,
        }
      : await getVideoById(id);

  if (!video) notFound();

  const breadcrumbItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Videos", to: "/admin/videos" },
    { label: video.title || "New", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadcrumbItems}>
      <div className="p-8 flex flex-col">
        <VideoForm
          id={video.id || undefined}
          title={video.title}
          url={video.url}
          visibility={video.visibility}
          videoDate={video.videoDate}
        />
      </div>
    </AdminPageLayout>
  );
};

export default VideoPage;

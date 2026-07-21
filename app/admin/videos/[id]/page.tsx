import { notFound } from "next/navigation";

import { getAllVideoChannels } from "@/app/_data/video-channels";
import { getVideoById } from "@/app/_data/videos";
import { AdminPageLayout, VideoForm } from "@/components/index";

const VideoPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const [video, channels] = await Promise.all([
    id === "new"
      ? Promise.resolve({
          id: "",
          title: "",
          url: "",
          thumbnailUrl: null,
          channelId: null,
          videoDate: new Date(),
          visibility: "PRIVATE" as const,
        })
      : getVideoById(id),
    getAllVideoChannels(),
  ]);

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
          thumbnailUrl={video.thumbnailUrl}
          channelId={video.channelId}
          channels={channels}
          visibility={video.visibility}
          videoDate={video.videoDate}
          provider={video.provider}
          providerVideoId={video.providerVideoId}
          embedUrl={video.embedUrl}
          durationSeconds={video.durationSeconds}
        />
      </div>
    </AdminPageLayout>
  );
};

export default VideoPage;

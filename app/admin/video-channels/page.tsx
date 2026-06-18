import { getAllVideoChannels } from "@/app/_data/video-channels";
import { AdminPageLayout, VideoChannelCreateDialog, VideoChannelsTable } from "@/components/index";

export const dynamic = "force-dynamic";

const VideoChannelsPage = async () => {
  const channels = await getAllVideoChannels();

  const breadItems = [
    { label: "Dashboard", to: "/admin" },
    { label: "Video Channels", to: null },
  ];

  return (
    <AdminPageLayout breadcrumbs={breadItems} headerRight={<VideoChannelCreateDialog />}>
      <VideoChannelsTable data={channels} />
    </AdminPageLayout>
  );
};

export default VideoChannelsPage;

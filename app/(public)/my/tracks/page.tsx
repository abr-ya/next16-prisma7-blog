import type { Metadata } from "next";

import { getAllTracks } from "@/app/_data/tracks";
import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { TrackManagementPanel } from "@/components/admin-pages/tracks-admin-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My tracks",
  description: "Upload and manage your personal GPX tracks.",
  path: "/my/tracks",
});

const MyTracksPage = async () => {
  await requireAuth();
  const [tracks, activityTypes] = await Promise.all([getAllTracks(), getActiveTrackActivityTypes()]);

  return (
    <PageLayout title="My tracks" contentWidth="wide" className="pt-6">
      <TrackManagementPanel tracks={tracks} activityTypes={activityTypes} />
    </PageLayout>
  );
};

export default MyTracksPage;

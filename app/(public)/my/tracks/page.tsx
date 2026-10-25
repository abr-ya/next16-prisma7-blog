import type { Metadata } from "next";

import { getOwnerGear } from "@/app/_data/gear";
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
  // feature-122: the gear is owner-private, so the owner pages read their own
  // gear and ask for the attachment projection — the administrative panel
  // asks for neither.
  const [tracks, activityTypes, gear] = await Promise.all([
    getAllTracks({ includeGear: true }),
    getActiveTrackActivityTypes(),
    getOwnerGear(),
  ]);

  return (
    <PageLayout title="My tracks" contentWidth="wide" className="pt-6">
      <TrackManagementPanel tracks={tracks} activityTypes={activityTypes} ownerGear={gear} />
    </PageLayout>
  );
};

export default MyTracksPage;

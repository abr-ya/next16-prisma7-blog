import type { Metadata } from "next";

import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { getOwnerWorkoutTracks } from "@/app/_data/tracks";
import { TrackManagementPanel } from "@/components/admin-pages/tracks-admin-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My workouts",
  description: "Your routine training sessions — the tracks you marked as workouts.",
  path: "/my/workouts",
});

const MyWorkoutsPage = async () => {
  await requireAuth();
  const [tracks, activityTypes] = await Promise.all([getOwnerWorkoutTracks(), getActiveTrackActivityTypes()]);

  return (
    <PageLayout title="My workouts" contentWidth="wide" className="pt-6">
      <TrackManagementPanel tracks={tracks} activityTypes={activityTypes} defaultKind="TRAINING" />
    </PageLayout>
  );
};

export default MyWorkoutsPage;

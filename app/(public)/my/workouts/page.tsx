import type { Metadata } from "next";

import { getOwnerGear } from "@/app/_data/gear";
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
  // feature-122: the owner's own gear, and the attachment projection — the
  // same pair the "My tracks" page reads.
  const [tracks, activityTypes, gear] = await Promise.all([
    getOwnerWorkoutTracks({ includeGear: true }),
    getActiveTrackActivityTypes(),
    getOwnerGear(),
  ]);

  return (
    <PageLayout title="My workouts" contentWidth="wide" className="pt-6">
      <TrackManagementPanel
        tracks={tracks}
        activityTypes={activityTypes}
        ownerGear={gear}
        defaultKind="TRAINING"
        tableVariant="workouts"
      />
    </PageLayout>
  );
};

export default MyWorkoutsPage;

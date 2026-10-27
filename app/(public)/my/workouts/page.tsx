import type { Metadata } from "next";

import { getOwnerGear, getOwnerGearPreferences } from "@/app/_data/gear";
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
  // same pair the "My tracks" page reads. feature-124 adds the preferred
  // gear per activity type, read with the same scope.
  const [tracks, activityTypes, gear, gearPreferences] = await Promise.all([
    getOwnerWorkoutTracks({ includeGear: true }),
    getActiveTrackActivityTypes(),
    getOwnerGear(),
    getOwnerGearPreferences(),
  ]);

  return (
    <PageLayout title="My workouts" contentWidth="wide" className="pt-6">
      <TrackManagementPanel
        tracks={tracks}
        activityTypes={activityTypes}
        ownerGear={gear}
        ownerGearPreferences={gearPreferences}
        defaultKind="TRAINING"
        tableVariant="workouts"
        // feature-123: the one-click quick upload lives here — the page whose
        // rows are workouts. "My tracks" and the administrative panel keep the
        // full form only.
        quickWorkoutUpload
      />
    </PageLayout>
  );
};

export default MyWorkoutsPage;

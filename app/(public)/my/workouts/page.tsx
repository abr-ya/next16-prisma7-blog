import type { Metadata } from "next";
import { getT, initServerI18next } from "next-i18next/server";

import { getOwnerGear, getOwnerGearPreferences } from "@/app/_data/gear";
import { getOwnerRoutes } from "@/app/_data/routes";
import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { getOwnerWorkoutTracks } from "@/app/_data/tracks";
import { workspaceNamespace } from "@/app/i18n/settings";
import { TrackManagementPanel } from "@/components/admin-pages/tracks-admin-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import i18nConfig from "@/i18n.config";

initServerI18next(i18nConfig);

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My workouts",
  description: "Your routine training sessions — the tracks you marked as workouts.",
  path: "/my/workouts",
});

const MyWorkoutsPage = async () => {
  const { t } = await getT(workspaceNamespace);
  await requireAuth();
  // feature-122: the owner's own gear, and the attachment projection — the
  // same pair the "My tracks" page reads. feature-124 adds the preferred
  // gear per activity type, read with the same scope.
  const [tracks, activityTypes, gear, gearPreferences, routes] = await Promise.all([
    getOwnerWorkoutTracks({ includeGear: true, includePrivateNote: true }),
    getActiveTrackActivityTypes(),
    getOwnerGear(),
    getOwnerGearPreferences(),
    getOwnerRoutes(),
  ]);

  return (
    <PageLayout title={t("pages.myWorkouts")} contentWidth="wide" className="pt-6">
      <TrackManagementPanel
        tracks={tracks}
        activityTypes={activityTypes}
        routes={routes}
        ownerGear={gear}
        ownerGearPreferences={gearPreferences}
        defaultKind="TRAINING"
        tableVariant="workouts"
        // feature-123: the one-click quick upload lives here — the page whose
        // rows are workouts. "My tracks" and the administrative panel keep the
        // full form only.
        quickWorkoutUpload
        // feature-141: draft capture is a walking-only owner action on the same
        // page.
        draftWorkoutUpload
        showPrivateNote
      />
    </PageLayout>
  );
};

export default MyWorkoutsPage;

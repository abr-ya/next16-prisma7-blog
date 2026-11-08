import type { Metadata } from "next";
import { getT, initServerI18next } from "next-i18next/server";

import { getOwnerGear } from "@/app/_data/gear";
import { getOwnerRoutes } from "@/app/_data/routes";
import { getAllTracks } from "@/app/_data/tracks";
import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { workspaceNamespace } from "@/app/i18n/settings";
import { TrackManagementPanel } from "@/components/admin-pages/tracks-admin-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import i18nConfig from "@/i18n.config";

initServerI18next(i18nConfig);

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My tracks",
  description: "Upload and manage your personal GPX tracks.",
  path: "/my/tracks",
});

const MyTracksPage = async () => {
  const { t } = await getT(workspaceNamespace);
  await requireAuth();
  // feature-122: the gear is owner-private, so the owner pages read their own
  // gear and ask for the attachment projection — the administrative panel
  // asks for neither.
  const [tracks, activityTypes, gear, routes] = await Promise.all([
    getAllTracks({ includeGear: true, includePrivateNote: true }),
    getActiveTrackActivityTypes(),
    getOwnerGear(),
    getOwnerRoutes(),
  ]);

  return (
    <PageLayout title={t("pages.myTracks")} contentWidth="wide" className="pt-6">
      <TrackManagementPanel
        tracks={tracks}
        activityTypes={activityTypes}
        routes={routes}
        ownerGear={gear}
        showPrivateNote
      />
    </PageLayout>
  );
};

export default MyTracksPage;

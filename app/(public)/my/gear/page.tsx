import type { Metadata } from "next";
import { getT, initServerI18next } from "next-i18next/server";

import { getOwnerGear, getOwnerGearPreferences } from "@/app/_data/gear";
import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { workspaceNamespace } from "@/app/i18n/settings";
import { GearPanel } from "@/components/admin-pages/gear-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import i18nConfig from "@/i18n.config";

initServerI18next(i18nConfig);

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My gear",
  description: "Your private inventory of shoes, bicycles, and other equipment.",
  path: "/my/gear",
});

const MyGearPage = async () => {
  const { t } = await getT(workspaceNamespace);
  await requireAuth();
  // feature-124: the preferences come with the rest of the page, in one read
  // and with the owner's scope.
  const [gear, activityTypes, preferences] = await Promise.all([
    getOwnerGear(),
    getActiveTrackActivityTypes(),
    getOwnerGearPreferences(),
  ]);

  return (
    <PageLayout title={t("pages.myGear")} contentWidth="wide" className="pt-6">
      <GearPanel gear={gear} activityTypes={activityTypes} preferences={preferences} />
    </PageLayout>
  );
};

export default MyGearPage;

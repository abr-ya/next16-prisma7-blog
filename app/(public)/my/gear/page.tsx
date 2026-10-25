import type { Metadata } from "next";

import { getOwnerGear } from "@/app/_data/gear";
import { getActiveTrackActivityTypes } from "@/app/_data/track-activity-types";
import { GearPanel } from "@/components/admin-pages/gear-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My gear",
  description: "Your private inventory of shoes, bicycles, and other equipment.",
  path: "/my/gear",
});

const MyGearPage = async () => {
  await requireAuth();
  const [gear, activityTypes] = await Promise.all([getOwnerGear(), getActiveTrackActivityTypes()]);

  return (
    <PageLayout title="My gear" contentWidth="wide" className="pt-6">
      <GearPanel gear={gear} activityTypes={activityTypes} />
    </PageLayout>
  );
};

export default MyGearPage;

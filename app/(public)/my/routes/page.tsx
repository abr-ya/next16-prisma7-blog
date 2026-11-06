import type { Metadata } from "next";
import { getT, initServerI18next } from "next-i18next/server";

import { getOwnerRoutes } from "@/app/_data/routes";
import { workspaceNamespace } from "@/app/i18n/settings";
import { PageLayout } from "@/components/layout/page-layout";
import { RoutesPanel } from "@/components/track-pages/routes-panel";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import i18nConfig from "@/i18n.config";

initServerI18next(i18nConfig);

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My routes",
  description: "Your reusable route shapes for tracks and workouts.",
  path: "/my/routes",
});

const MyRoutesPage = async () => {
  const { t } = await getT(workspaceNamespace);
  await requireAuth();
  const routes = await getOwnerRoutes();

  return (
    <PageLayout title={t("pages.myRoutes")} contentWidth="wide" className="pt-6">
      <RoutesPanel routes={routes} />
    </PageLayout>
  );
};

export default MyRoutesPage;

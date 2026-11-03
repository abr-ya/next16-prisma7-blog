import type { Metadata } from "next";

import { getOwnerRoutes } from "@/app/_data/routes";
import { PageLayout } from "@/components/layout/page-layout";
import { RoutesPanel } from "@/components/track-pages/routes-panel";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My routes",
  description: "Your reusable route shapes for tracks and workouts.",
  path: "/my/routes",
});

const MyRoutesPage = async () => {
  await requireAuth();
  const routes = await getOwnerRoutes();

  return (
    <PageLayout title="My routes" contentWidth="wide" className="pt-6">
      <RoutesPanel routes={routes} />
    </PageLayout>
  );
};

export default MyRoutesPage;

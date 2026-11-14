import type { Metadata } from "next";
import { getT, initServerI18next } from "next-i18next/server";

import { getOwnerFavoritePlaces } from "@/app/_data/favorite-places";
import { workspaceNamespace } from "@/app/i18n/settings";
import { FavoritePlacesPanel } from "@/components/admin-pages/favorite-places-panel";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import i18nConfig from "@/i18n.config";

initServerI18next(i18nConfig);

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My places",
  description: "Your private list of places you start routes from.",
  path: "/my/places",
});

// feature-148: the owner's saved places. The page requires a session and reads
// the owner's rows only — the data layer scopes every query by the session
// user, so the page itself never names an owner.
const MyPlacesPage = async () => {
  const { t } = await getT(workspaceNamespace);
  await requireAuth();
  const places = await getOwnerFavoritePlaces();

  return (
    <PageLayout title={t("pages.myPlaces")} contentWidth="wide" className="pt-6">
      <FavoritePlacesPanel places={places} />
    </PageLayout>
  );
};

export default MyPlacesPage;

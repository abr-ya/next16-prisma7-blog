import type { Metadata } from "next";
import { getT, initServerI18next } from "next-i18next/server";

import { getOwnerSourceAliases, type TrackSourceAliasListItem } from "@/app/_data/track-source-aliases";
import { workspaceNamespace } from "@/app/i18n/settings";
import { Badge } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";
import i18nConfig from "@/i18n.config";

initServerI18next(i18nConfig);

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Source names",
  description: "Personal names for the apps and devices that recorded your GPX tracks.",
  path: "/my/source-aliases",
});

const groups: Array<{ kind: TrackSourceAliasListItem["kind"]; title: string }> = [
  { kind: "APP", title: "Apps" },
  { kind: "DEVICE", title: "Devices" },
];

const MySourceAliasesPage = async () => {
  const { t } = await getT(workspaceNamespace);
  await requireAuth();
  const aliases = await getOwnerSourceAliases();

  return (
    <PageLayout title={t("pages.sourceAliases")} contentWidth="wide" className="pt-6">
      <div className="grid max-w-3xl gap-6 pb-10">
        <p className="text-muted-foreground">
          A source name replaces the raw GPX creator or device on your tracks. This page lists the names you have
          stored; adding and editing them arrives in a later update.
        </p>

        {aliases.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No source names yet. Once you rename a source on a track, it will appear here.
          </div>
        ) : (
          groups.map((group) => {
            const rows = aliases.filter((alias) => alias.kind === group.kind);

            if (rows.length === 0) return null;

            return (
              <section key={group.kind} className="grid gap-3">
                <h2 className="text-base font-semibold">{group.title}</h2>
                <div className="grid gap-2">
                  {rows.map((alias) => (
                    <div key={alias.id} className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
                      <span className="font-medium">{alias.label}</span>
                      <span className="text-muted-foreground" aria-hidden="true">
                        ←
                      </span>
                      <span className="text-muted-foreground">{alias.rawValue}</span>
                      <Badge variant="outline" className="ml-auto">
                        {group.kind === "APP" ? "App" : "Device"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </PageLayout>
  );
};

export default MySourceAliasesPage;

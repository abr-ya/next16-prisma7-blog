import Link from "next/link";

import { getT, initServerI18next } from "next-i18next/server";

import { guideNamespace } from "@/app/i18n/settings";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import i18nConfig from "@/i18n.config";
import { buildPageMetadata } from "@/lib/site-metadata";

initServerI18next(i18nConfig);

export const metadata = buildPageMetadata({
  title: "About",
  description: "Learn about the project, its content areas, and account participation levels.",
  path: "/about",
});

const sections = [
  { key: "blog", href: "/blog" },
  { key: "docs", href: "/docs" },
  { key: "videos", href: "/videos" },
  { key: "trips", href: "/trips" },
  { key: "tracks", href: "/tracks" },
  { key: "comments", href: "/comments" },
] as const;

export default async function AboutPage() {
  const { t } = await getT(guideNamespace);

  return (
    <PageLayout title={t("overview.title")} contentWidth="wide" className="pt-6">
      <div className="grid gap-8 pb-10">
        <p className="max-w-2xl text-muted-foreground">{t("overview.intro")}</p>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t("overview.accountTitle")}</CardTitle>
            <CardDescription>{t("overview.accountDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/about/account-levels">{t("overview.accountAction")}</Link>
            </Button>
          </CardContent>
        </Card>
        <section className="grid gap-4" aria-labelledby="about-sections-title">
          <div>
            <h2 id="about-sections-title" className="text-xl font-semibold">
              {t("overview.sectionsTitle")}
            </h2>
            <p className="text-muted-foreground">{t("overview.sectionsDescription")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle>{t(`overview.${section.key}`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href={section.href}>{t("overview.openSection")}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

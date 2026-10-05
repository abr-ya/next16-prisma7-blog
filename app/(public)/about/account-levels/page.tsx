import Link from "next/link";

import { getT, initServerI18next } from "next-i18next/server";

import { guideNamespace } from "@/app/i18n/settings";
import { Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import i18nConfig from "@/i18n.config";
import { buildPageMetadata } from "@/lib/site-metadata";

initServerI18next(i18nConfig);

export const metadata = buildPageMetadata({
  title: "Account levels",
  description: "Learn how account trust levels affect participation.",
  path: "/about/account-levels",
});

const levels = ["new", "verified", "trusted", "restricted"] as const;

export default async function AccountLevelsPage() {
  const { t } = await getT(guideNamespace);

  return (
    <PageLayout title={t("accountLevels.title")} contentWidth="wide" className="pt-6">
      <div className="grid max-w-3xl gap-6 pb-10">
        <p className="text-muted-foreground">{t("accountLevels.intro")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level) => (
            <Card key={level}>
              <CardHeader>
                <CardTitle>{t(`accountLevels.${level}.title`)}</CardTitle>
                <CardDescription>{t(`accountLevels.${level}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("accountLevels.roleTitle")}</CardTitle>
            <CardDescription>{t("accountLevels.roleDescription")}</CardDescription>
          </CardHeader>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/sign-in">{t("accountLevels.signIn")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-up">{t("accountLevels.signUp")}</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

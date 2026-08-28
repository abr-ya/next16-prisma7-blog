"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useChangeLanguage, useT } from "next-i18next/client";
import { Button, NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/index";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { navigationNamespace, supportedLanguages } from "@/app/i18n/settings";

import { NavbarUserMenu } from "./navbar-user-menu";

interface INavbarProps {
  userId?: string;
  userName?: string | null;
  userImage?: string | null;
}

const publicNavItems = [
  { href: "/", labelKey: "home" },
  { href: "/blog", labelKey: "blog" },
  { href: "/docs", labelKey: "docs" },
  { href: "/videos", labelKey: "videos" },
  { href: "/tracks", labelKey: "tracks" },
  { href: "/comments", labelKey: "comments" },
];

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export const Navbar = ({ userId, userName, userImage }: INavbarProps) => {
  const router = useRouter();
  const changeLanguage = useChangeLanguage();
  const { i18n, t } = useT(navigationNamespace);
  const isHydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerSnapshot);

  const goBack = () => {
    router.back();
  };

  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <NavigationMenu viewport={false} className="sticky top-0 z-50 mx-auto my-5 max-w-full bg-white py-2">
      <div className="container flex w-full flex-wrap items-center justify-between gap-3">
        <NavigationMenuList className="flex-wrap items-center gap-1">
          <NavigationMenuItem>
            <span className="px-2 text-sm text-muted-foreground">{t("label")}</span>
          </NavigationMenuItem>
          {publicNavItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-blue-100">
                {t(item.labelKey)}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
          <NavigationMenuItem>
            <Button variant="ghost" onClick={goBack} className="cursor-pointer hover:bg-blue-100">
              {t("back")}
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>

        <NavigationMenuList className="flex-wrap items-center gap-2">
          <NavigationMenuItem>
            <div className="flex items-center gap-1 rounded-md border px-1 py-1" aria-label={t("languageLabel")}>
              {supportedLanguages.map((language) => {
                const isActive = isHydrated && activeLanguage === language;

                return (
                  <Button
                    key={language}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="h-7 min-w-9 px-2 text-xs uppercase"
                    aria-pressed={isActive}
                    title={t(language === "en" ? "languageEnglish" : "languageRussian")}
                    onClick={() => void changeLanguage(language)}
                  >
                    {language}
                  </Button>
                );
              })}
            </div>
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden md:block">
            <div className="mr-6 cursor-pointer" onClick={() => console.log("setIsOpen(true)")}>
              <Search />
            </div>
            {/* todo: SearchModal component */}
          </NavigationMenuItem>
          <NavigationMenuItem>
            {userId ? (
              <NavbarUserMenu userName={userName ?? undefined} userImage={userImage} />
            ) : (
              <Button variant="default" asChild className="cursor-pointer">
                <Link href="/sign-in">{t("login")}</Link>
              </Button>
            )}
          </NavigationMenuItem>
        </NavigationMenuList>
      </div>
    </NavigationMenu>
  );
};

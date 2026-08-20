"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Button, NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/index";
import { useRouter } from "next/navigation";

import { NavbarUserMenu } from "./navbar-user-menu";

interface INavbarProps {
  userId?: string;
  userName?: string | null;
  userImage?: string | null;
}

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/docs", label: "Docs" },
  { href: "/videos", label: "Videos" },
  { href: "/comments", label: "Comments" },
];

export const Navbar = ({ userId, userName, userImage }: INavbarProps) => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <NavigationMenu viewport={false} className="sticky top-0 z-50 mx-auto my-5 max-w-full bg-white py-2">
      <div className="container flex w-full flex-wrap items-center justify-between gap-3">
        <NavigationMenuList className="flex-wrap items-center gap-1">
          <NavigationMenuItem>
            <span className="px-2 text-sm text-muted-foreground">Navigation:</span>
          </NavigationMenuItem>
          {publicNavItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-blue-100">
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
          <NavigationMenuItem>
            <Button variant="ghost" onClick={goBack} className="cursor-pointer hover:bg-blue-100">
              Back
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>

        <NavigationMenuList className="flex-wrap items-center gap-2">
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
                <Link href="/sign-in">Log in</Link>
              </Button>
            )}
          </NavigationMenuItem>
        </NavigationMenuList>
      </div>
    </NavigationMenu>
  );
};

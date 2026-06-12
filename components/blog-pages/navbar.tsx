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

export const Navbar = ({ userId, userName, userImage }: INavbarProps) => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <NavigationMenu viewport={false} className="sticky top-0 z-50 mx-auto max-w-full my-5 bg-white py-2">
      <div className="flex justify-between w-full container">
        <NavigationMenuList className="flex-wrap">
          Navigation:
          <NavigationMenuItem>
            <NavigationMenuLink href="/" className="hover:bg-blue-100 px-3 py-2 rounded-md">
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/videos" className="hover:bg-blue-100 px-3 py-2 rounded-md">
              Videos
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button variant="ghost" onClick={goBack} className="cursor-pointer hover:bg-blue-100">
              Back
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>

        <NavigationMenuList className="flex-wrap">
          <NavigationMenuItem className="hidden md:block">
            <div className="mr-6 cursor-pointer" onClick={() => console.log("setIsOpen(true)")}>
              <Search />
            </div>
            {/* todo: SearchModal component */}
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden md:block">
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

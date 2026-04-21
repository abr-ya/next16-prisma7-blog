"use client";

import { LayoutDashboard, LogOut, Search } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/index";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface INavbarProps {
  userName?: string;
  userImage?: string | null;
}

function avatarFallbackText(name?: string | null): string {
  const n = name?.trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const w = parts[0];
  return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w[0].toUpperCase();
}

export const Navbar = ({ userName, userImage }: INavbarProps) => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  const fallbackLabel = avatarFallbackText(userName);

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
            <NavigationMenuTrigger>
              <Avatar className="w-8 h-8 rounded-full">
                {userImage ? (
                  <AvatarImage src={userImage} alt={userName ? `${userName}'s avatar` : "User avatar"} />
                ) : null}
                <AvatarFallback delayMs={userImage ? 600 : 0}>{fallbackLabel}</AvatarFallback>
              </Avatar>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-50 gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link href="/dashboard" className="flex-row items-center gap-2">
                      <LayoutDashboard />
                      Dashboard
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <div className="flex-row items-center gap-2 cursor-pointer" onClick={() => void handleSignOut()}>
                      <LogOut />
                      Signout
                    </div>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </div>
    </NavigationMenu>
  );
};

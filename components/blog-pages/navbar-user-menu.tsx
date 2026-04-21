"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/index";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export interface NavbarUserMenuProps {
  userName?: string;
  userImage?: string | null;
}

const avatarFallbackText = (name?: string | null): string => {
  const n = name?.trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const w = parts[0];
  return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w[0].toUpperCase();
};

export const NavbarUserMenu = ({ userName, userImage }: NavbarUserMenuProps) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  const fallbackLabel = avatarFallbackText(userName);

  return (
    <>
      <NavigationMenuTrigger>
        <Avatar className="w-8 h-8 rounded-full">
          {userImage ? (
            <AvatarImage src={userImage} alt={userName ? `${userName}'s avatar` : "User avatar"} />
          ) : null}
          <AvatarFallback delayMs={userImage ? 600 : 0}>{fallbackLabel}</AvatarFallback>
        </Avatar>
      </NavigationMenuTrigger>
      <NavigationMenuContent className="left-auto right-0 w-max min-w-[10rem]">
        <ul className="grid gap-4">
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
    </>
  );
};

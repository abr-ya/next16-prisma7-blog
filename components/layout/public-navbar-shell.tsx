import { ReactNode } from "react";

import { Navbar } from "@/components/blog-pages/navbar";
import { authSession } from "@/lib/auth-utils";

interface PublicNavbarShellProps {
  children: ReactNode;
}

export const PublicNavbarShell = async ({ children }: PublicNavbarShellProps) => {
  const session = await authSession();

  return (
    <div className="relative w-full">
      <Navbar userId={session?.user.id} userName={session?.user.name} userImage={session?.user.image} />
      {children}
    </div>
  );
};

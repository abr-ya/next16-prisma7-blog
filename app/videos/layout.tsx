import { ReactNode } from "react";

import { Navbar } from "@/components/index";
import { authSession } from "@/lib/auth-utils";

const VideosLayout = async ({ children }: { children: ReactNode }) => {
  const session = await authSession();

  return (
    <div className="relative w-full">
      <Navbar userId={session?.user.id} userName={session?.user.name} userImage={session?.user.image} />
      {children}
    </div>
  );
};

export default VideosLayout;

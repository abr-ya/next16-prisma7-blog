import { Navbar } from "@/components/index";
import { authSession } from "@/lib/auth-utils";
import { ReactNode } from "react";

const BlogLayout = async ({ children }: { children: ReactNode }) => {
  const session = await authSession();

  return (
    <>
      <div className="relative w-full">
        <Navbar userName={session?.user.name} userImage={session?.user.image} />
        {children}
      </div>
    </>
  );
};

export default BlogLayout;

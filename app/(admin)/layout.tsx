import { ReactNode } from "react";
import { AppSidebar, SidebarProvider } from "@/components/index";
import { authSession } from "@/lib/auth-utils";

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  let userId: string | null = null;

  try {
    const session = await authSession();
    userId = session?.user?.id ?? null;
  } catch (err: unknown) {
    console.error(err);
    // no session
    userId = null;
  }

  return (
    <SidebarProvider>
      <AppSidebar userId={userId} />
      <main className="p-6 w-full">{children}</main>
    </SidebarProvider>
  );
};

export default AdminLayout;

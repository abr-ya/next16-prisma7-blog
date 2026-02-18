import { ReactNode } from "react";
import { AdminSidebar, SidebarProvider } from "@/components/index";
import { authSession } from "@/lib/auth-utils";
import { IUser } from "../_interfaces/user.interface";

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  let user: IUser | null = null;

  try {
    const session = await authSession();
    user = session?.user ?? null;
  } catch (err: unknown) {
    console.error(err);
    // no session
    user = null;
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <main className="p-6 w-full">{children}</main>
    </SidebarProvider>
  );
};

export default AdminLayout;

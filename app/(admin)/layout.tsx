import { ReactNode } from "react";
import { AdminSidebar, SidebarProvider } from "@/components/index";
import { requireAuth } from "@/lib/auth-utils";
import { IUser } from "../_interfaces/user.interface";

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const session = await requireAuth();

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user as IUser} />
      {session ? <main className="p-6 w-full">{children}</main> : <div>Loading...</div>}
    </SidebarProvider>
  );
};

export default AdminLayout;

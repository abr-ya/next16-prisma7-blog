import { ReactNode } from "react";
import { AdminSidebar, SidebarProvider } from "@/components/index";
import { currentUserRole, requireAuth } from "@/lib/auth-utils";
import { hasAdminRole } from "@/lib/auth-roles";
import { IUser } from "../_interfaces/user.interface";

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const [session, role] = await Promise.all([requireAuth(), currentUserRole()]);

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user as IUser} isAdmin={hasAdminRole(role)} />
      {session ? <main className="p-6 w-full">{children}</main> : <div>Loading...</div>}
    </SidebarProvider>
  );
};

export default AdminLayout;

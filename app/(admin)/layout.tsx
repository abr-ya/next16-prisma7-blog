import { ReactNode } from "react";
import { AppSidebar, SidebarProvider } from "@/components/index";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <AppSidebar />
    <div className="p-6 w-full">{children}</div>
  </SidebarProvider>
);

export default AdminLayout;

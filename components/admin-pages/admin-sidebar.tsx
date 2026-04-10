import { Calendar, ChartPie, ExternalLink, Inbox, Search, House, FileText } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { IUser } from "@/app/_interfaces/user.interface";

// Menu items
const items = [
  {
    title: "Home",
    url: "/",
    icon: House,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: ChartPie,
  },
  {
    title: "Posts",
    url: "/posts",
    icon: Inbox,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Calendar,
  },
  {
    title: "Links",
    url: "/links",
    icon: ExternalLink,
  },
  {
    title: "MD Posts",
    url: "/md-posts",
    icon: FileText,
  },
  {
    title: "Saved Posts",
    url: "saved-posts",
    icon: Search,
  },
];

interface AdminSidebarProps {
  user: IUser | null;
}

export const AdminSidebar = ({ user }: AdminSidebarProps) => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>NextBlog</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Show signed-in user id (server-only) */}
            <div className="mb-3 text-sm text-muted-foreground">{user ? `Hello, ${user.name}!` : "Not signed in"}</div>

            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

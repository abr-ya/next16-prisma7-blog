import { Calendar, ChartPie, ExternalLink, Inbox, Search, House } from "lucide-react";

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
    title: "Saved Posts",
    url: "saved-posts",
    icon: Search,
  },
];

interface AdminSidebarProps {
  userId: string | null;
}

export const AdminSidebar = ({ userId }: AdminSidebarProps) => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>NextBlog</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Show signed-in user id (server-only) */}
            <div className="mb-3 text-sm text-muted-foreground">{userId ? `User: ${userId}` : "Not signed in"}</div>

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

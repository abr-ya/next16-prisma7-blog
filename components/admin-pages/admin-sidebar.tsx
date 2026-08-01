import { Calendar, ChartPie, ExternalLink, File, FileText, House, Inbox, ListVideo, Search, Video } from "lucide-react";

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
    url: "/admin",
    icon: ChartPie,
  },
  {
    title: "Posts",
    url: "/admin/posts",
    icon: Inbox,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: Calendar,
  },
  {
    title: "Links",
    url: "/admin/links",
    icon: ExternalLink,
  },
  {
    title: "MD Docs",
    url: "/admin/md-docs",
    icon: FileText,
  },
  {
    title: "Files",
    url: "/admin/files",
    icon: File,
  },
  {
    title: "Videos",
    url: "/admin/videos",
    icon: Video,
  },
  {
    title: "Video Channels",
    url: "/admin/video-channels",
    icon: ListVideo,
  },
  {
    title: "Saved Posts",
    url: "/admin/saved-posts",
    icon: Search,
  },
];

interface AdminSidebarProps {
  user: IUser | null;
}

export const AdminSidebar = ({ user }: AdminSidebarProps) => (
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

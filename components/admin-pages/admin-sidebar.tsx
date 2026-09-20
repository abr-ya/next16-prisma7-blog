import {
  Calendar,
  ChartPie,
  Database,
  ExternalLink,
  File,
  FileText,
  House,
  Inbox,
  ListVideo,
  Map,
  Images,
  Route,
  Search,
  Tags,
  Video,
} from "lucide-react";

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

const personalWorkspaceItems = [
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
    title: "Trips",
    url: "/admin/trips",
    icon: Map,
  },
  {
    title: "Tracks",
    url: "/admin/tracks",
    icon: Route,
  },
  {
    title: "Videos",
    url: "/admin/videos",
    icon: Video,
  },
  {
    title: "Saved Posts",
    url: "/admin/saved-posts",
    icon: Search,
  },
];

const administratorControlItems = [
  { title: "MD Docs", url: "/admin/md-docs", icon: FileText },
  { title: "Video Channels", url: "/admin/video-channels", icon: ListVideo },
  { title: "Photos", url: "/admin/photos", icon: Images },
  { title: "Files", url: "/admin/files", icon: File },
  { title: "Content Tags", url: "/admin/content-tags", icon: Tags },
  { title: "Database", url: "/admin/database", icon: Database },
];

interface AdminSidebarProps {
  user: IUser | null;
  isAdmin?: boolean;
}

export const AdminSidebar = ({ user, isAdmin = false }: AdminSidebarProps) => (
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>NextBlog</SidebarGroupLabel>
        <SidebarGroupContent>
          {/* Show signed-in user id (server-only) */}
          <div className="mb-3 text-sm text-muted-foreground">{user ? `Hello, ${user.name}!` : "Not signed in"}</div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/">
                  <House />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Personal workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {personalWorkspaceItems.map((item) => (
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
      {isAdmin ? (
        <SidebarGroup>
          <SidebarGroupLabel>Administrator controls</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {administratorControlItems.map((item) => (
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
      ) : null}
    </SidebarContent>
  </Sidebar>
);

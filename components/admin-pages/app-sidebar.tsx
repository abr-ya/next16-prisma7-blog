import { Calendar, Home, Inbox, Search } from "lucide-react";

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

import { authSession } from "@/lib/auth-utils";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
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
    title: "Saved Posts",
    url: "saved-posts",
    icon: Search,
  },
];

export const AppSidebar = async () => {
  let userId: string | null = null;

  try {
    const session = await authSession();
    userId = session?.user?.id ?? null;
  } catch (err: unknown) {
    // no session
    userId = null;
    console.log(err);
  }

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

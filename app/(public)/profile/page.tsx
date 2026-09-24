import type { Metadata } from "next";
import Link from "next/link";
import { Camera, FileText, MapPinned, Route } from "lucide-react";

import { getCurrentUserProfile } from "@/app/_data/profile";
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { HikeInvitations } from "@/components/hike-pages/hike-invitations";
import { PageLayout } from "@/components/layout/page-layout";
import { requireAuth } from "@/lib/auth-utils";
import { buildPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Profile",
  description: "Your profile, personal content, and trip invitations.",
  path: "/profile",
});

const avatarFallbackText = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

const contentItems = [
  { key: "posts", label: "Posts", emptyLabel: "No posts yet", href: "/admin/posts", icon: FileText },
  { key: "trips", label: "Trips", emptyLabel: "No trips yet", href: "/admin/trips", icon: MapPinned },
  { key: "tracks", label: "Tracks", emptyLabel: "No tracks yet", href: "/admin/tracks", icon: Route },
  { key: "photos", label: "Photos", emptyLabel: "No photos yet", href: "/admin/photos", icon: Camera },
] as const;

export default async function ProfilePage() {
  await requireAuth();
  const profile = await getCurrentUserProfile();

  if (!profile) return null;

  const avatarFallback = avatarFallbackText(profile.user.name);

  return (
    <PageLayout title="Profile" contentWidth="wide">
      <div className="grid gap-6 pb-10">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <Avatar className="size-16">
              {profile.user.image ? (
                <AvatarImage src={profile.user.image} alt={`${profile.user.name}'s avatar`} />
              ) : null}
              <AvatarFallback delayMs={profile.user.image ? 600 : 0} className="text-lg">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profile.user.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.user.email}</p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3" aria-labelledby="your-content-heading">
          <h2 id="your-content-heading" className="text-xl font-semibold">
            Your content
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {contentItems.map(({ key, label, emptyLabel, href, icon: Icon }) => {
              const count = profile.contentCounts[key];

              return (
                <Card key={key}>
                  <CardHeader className="gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                      <CardTitle className="text-base">{label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <p className="text-2xl font-semibold">{count}</p>
                    <p className="text-sm text-muted-foreground">
                      {count === 0 ? emptyLabel : `${count} ${label.toLowerCase()}`}
                    </p>
                    <Link href={href} className="text-sm font-medium hover:underline">
                      View {label.toLowerCase()}
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3" aria-labelledby="trip-invitations-heading">
          <div>
            <h2 id="trip-invitations-heading" className="text-xl font-semibold">
              Trip invitations
            </h2>
            <p className="text-sm text-muted-foreground">Accept or decline invitations to join a trip.</p>
          </div>
          <HikeInvitations invitations={profile.invitations} />
        </section>
      </div>
    </PageLayout>
  );
}

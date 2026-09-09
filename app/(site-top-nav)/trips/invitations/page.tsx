import type { Metadata } from "next";

import { getPendingHikeInvitations } from "@/app/_data/hikes";
import { HikeInvitations } from "@/components/hike-pages/hike-invitations";
import { PageLayout } from "@/components/layout/page-layout";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Trip invitations",
  description: "Review your pending trip invitations.",
  path: "/trips/invitations",
});

export default async function TripInvitationsPage() {
  const invitations = await getPendingHikeInvitations();

  return (
    <PageLayout title="Trip invitations">
      <div className="grid gap-5">
        <p className="text-muted-foreground">Accept or decline invitations to join a trip.</p>
        <HikeInvitations invitations={invitations} />
      </div>
    </PageLayout>
  );
}

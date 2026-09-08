"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { respondToHikeInvitation, type PendingHikeInvitation } from "@/app/_data/hikes";
import { Button } from "@/components/index";
import { formatHikeDateRange } from "@/lib/hikes";

export const HikeInvitations = ({ invitations }: { invitations: PendingHikeInvitation[] }) => {
  const [isPending, startTransition] = useTransition();
  const respond = (id: string, accept: boolean) =>
    startTransition(async () => {
      try {
        await respondToHikeInvitation({ id, accept });
        toast.success(accept ? "Invitation accepted" : "Invitation declined");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not respond to invitation");
      }
    });

  if (invitations.length === 0)
    return (
      <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
        You have no pending trip invitations.
      </p>
    );

  return (
    <div className="grid gap-3">
      {invitations.map((invitation) => (
        <article
          key={invitation.id}
          className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link className="font-medium hover:underline" href={`/trips/${invitation.hike.slug}`}>
              {invitation.hike.title}
            </Link>
            <p className="text-sm text-muted-foreground">{formatHikeDateRange(invitation.hike)}</p>
          </div>
          <div className="flex gap-2">
            <Button disabled={isPending} onClick={() => respond(invitation.id, true)}>
              Accept
            </Button>
            <Button disabled={isPending} variant="outline" onClick={() => respond(invitation.id, false)}>
              Decline
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};

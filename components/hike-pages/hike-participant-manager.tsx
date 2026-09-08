"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  cancelHikeInvitation,
  inviteHikeParticipant,
  removeHikeParticipant,
  type HikeParticipantManagement,
} from "@/app/_data/hikes";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input } from "@/components/index";

export const HikeParticipantManager = ({ management }: { management: HikeParticipantManagement }) => {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<unknown>, success: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update participants");
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Participants</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Participants</DialogTitle>
        </DialogHeader>
        <section className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Invite an existing account by email. Membership starts after acceptance.
          </p>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              run(async () => {
                await inviteHikeParticipant({ hikeId: management.hike.id, email });
                setEmail("");
              }, "Invitation sent");
            }}
          >
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="person@example.com"
              required
            />
            <Button type="submit" disabled={isPending}>
              Invite
            </Button>
          </form>
          {management.pendingInvitations.length > 0 ? (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Pending invitations</h3>
              {management.pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {invitation.name} · {invitation.email}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => cancelHikeInvitation({ hikeId: management.hike.id, id: invitation.id }),
                        "Invitation cancelled",
                      )
                    }
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          {management.acceptedParticipants.length > 0 ? (
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Accepted participants</h3>
              {management.acceptedParticipants.map((participant) => (
                <div key={participant.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {participant.name} · {participant.email}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => removeHikeParticipant({ hikeId: management.hike.id, id: participant.id }),
                        "Participant removed",
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import type { TrackActivityType } from "@/generated/prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createTrackActivityType,
  deleteTrackActivityType,
  setTrackActivityTypeActive,
  updateTrackActivityType,
} from "@/app/_data/track-activity-types";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ActivityTypeRow = TrackActivityType & { _count: { tracks: number } };

export const TrackActivityTypesAdminPanel = ({ activityTypes }: { activityTypes: ActivityTypeRow[] }) => {
  const router = useRouter();
  const [nameEn, setNameEn] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ActivityTypeRow | null>(null);
  const [deleteReplacement, setDeleteReplacement] = useState("clear");
  const [isPending, startTransition] = useTransition();

  const refresh = () => router.refresh();
  const openDelete = (activityType: ActivityTypeRow) => {
    setDeleteReplacement("clear");
    setDeleteTarget(activityType);
  };
  const run = (action: () => Promise<void>, success: string) =>
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Activity type action failed");
      }
    });

  return (
    <div className="grid gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add activity type</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input value={nameEn} onChange={(event) => setNameEn(event.target.value)} placeholder="English name" />
          <Input
            value={nameRu}
            onChange={(event) => setNameRu(event.target.value)}
            placeholder="Russian name (optional)"
          />
          <Button
            disabled={isPending || !nameEn.trim()}
            onClick={() =>
              run(async () => {
                await createTrackActivityType({ nameEn, nameRu });
                setNameEn("");
                setNameRu("");
              }, "Activity type created")
            }
          >
            <Plus /> Add
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {activityTypes.map((activityType) => (
          <ActivityTypeEditor
            key={activityType.id}
            activityType={activityType}
            pending={isPending}
            run={run}
            onDelete={openDelete}
          />
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.nameEn}?` : "Delete activity type?"}
        description={
          deleteTarget?._count.tracks ? (
            <div className="grid gap-3">
              <span>
                This type is assigned to {deleteTarget._count.tracks} track(s). Choose how to preserve those records.
              </span>
              <Select value={deleteReplacement} onValueChange={setDeleteReplacement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">Clear classification</SelectItem>
                  {activityTypes
                    .filter((type) => type.id !== deleteTarget.id && type.isActive)
                    .map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        Reassign to {type.nameEn}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            "This type is unused and can be deleted."
          )
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(
            async () =>
              await deleteTrackActivityType({
                id: deleteTarget.id,
                replacementId: deleteReplacement === "clear" ? null : deleteReplacement,
              }),
            "Activity type deleted",
          );
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

const ActivityTypeEditor = ({
  activityType,
  pending,
  run,
  onDelete,
}: {
  activityType: ActivityTypeRow;
  pending: boolean;
  run: (action: () => Promise<void>, success: string) => void;
  onDelete: (activityType: ActivityTypeRow) => void;
}) => {
  const [nameEn, setNameEn] = useState(activityType.nameEn);
  const [nameRu, setNameRu] = useState(activityType.nameRu ?? "");
  return (
    <Card className="py-0">
      <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
        <Input value={nameEn} onChange={(event) => setNameEn(event.target.value)} aria-label="English name" />
        <Input
          value={nameRu}
          onChange={(event) => setNameRu(event.target.value)}
          aria-label="Russian name"
          placeholder="Russian name (optional)"
        />
        <div className="flex items-center gap-2">
          <Badge variant={activityType.isActive ? "default" : "secondary"}>
            {activityType.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">{activityType._count.tracks} tracks</Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() => updateTrackActivityType({ id: activityType.id, nameEn, nameRu }), "Activity type saved")
            }
          >
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setTrackActivityTypeActive({ id: activityType.id, isActive: !activityType.isActive }),
                activityType.isActive ? "Activity type deactivated" : "Activity type activated",
              )
            }
          >
            {activityType.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={pending}
            title="Delete activity type"
            onClick={() => onDelete(activityType)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

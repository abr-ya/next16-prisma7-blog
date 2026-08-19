"use client";

import type { VideoChannel } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteVideoChannel } from "@/app/_data/video-channels";

import { Badge, Button, ConfirmDialog, DataTable } from "..";
import { VideoChannelEditDialog } from "./video-channel-edit-dialog";

interface IVideoChannelsTableProps {
  data: VideoChannel[];
}

const formatDateTime = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatVisibility = (visibility: VideoChannel["visibility"]) => (visibility === "PUBLIC" ? "Public" : "Hidden");

const VideoChannelActions = ({ channel }: { channel: VideoChannel }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);

    try {
      const result = await deleteVideoChannel(channel.id);

      if (!result.success) {
        toast.error("Channel was not deleted");
        return;
      }

      toast.success("Channel deleted successfully");
      router.refresh();
    } catch {
      toast.error("Something went wrong deleting the channel");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex w-32 items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon" title="Open channel">
          <a href={channel.url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
          </a>
        </Button>
        <VideoChannelEditDialog channel={channel} />
        <Button
          variant="ghost"
          size="icon"
          title="Delete channel"
          className="text-destructive hover:text-destructive"
          disabled={isDeleting}
          onClick={() => setIsConfirmOpen(true)}
        >
          <Trash className="size-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={`Delete channel "${channel.name}"?`}
        description="Related videos will keep working without a channel."
        confirmLabel="Delete Channel"
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

const columns: ColumnDef<VideoChannel>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="min-w-56 max-w-md whitespace-normal wrap-anywhere">
        <h3 className="font-semibold leading-snug">{row.original.name}</h3>
      </div>
    ),
  },
  {
    accessorKey: "url",
    header: "URL",
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noreferrer"
        className="block w-64 truncate text-blue-500 underline-offset-4 hover:underline"
      >
        {row.original.url}
      </a>
    ),
  },
  {
    accessorKey: "imageUrl",
    header: "Image URL",
    cell: ({ row }) =>
      row.original.imageUrl ? (
        <a
          href={row.original.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-52 truncate text-blue-500 underline-offset-4 hover:underline"
        >
          {row.original.imageUrl}
        </a>
      ) : (
        <span className="text-muted-foreground">None</span>
      ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <Badge variant={row.original.visibility === "PUBLIC" ? "default" : "secondary"}>
        {formatVisibility(row.original.visibility)}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="w-36 justify-start"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="w-36 truncate" title={formatDateTime(row.getValue("createdAt") as Date)}>
        {formatDateTime(row.getValue("createdAt") as Date)}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="w-36 justify-start"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Updated
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="w-36 truncate" title={formatDateTime(row.getValue("updatedAt") as Date)}>
        {formatDateTime(row.getValue("updatedAt") as Date)}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <VideoChannelActions channel={row.original} />,
  },
];

export const VideoChannelsTable = ({ data }: IVideoChannelsTableProps) => (
  <div className="flex w-full min-w-0 max-w-full flex-col gap-2 p-4">
    <div className="text-sm text-muted-foreground">channels count: {data.length}</div>
    <DataTable data={data} columns={columns} />
  </div>
);

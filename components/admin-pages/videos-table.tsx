"use client";

import type { Video } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteVideo } from "@/app/_data/videos";

import { Button, DataTable } from "..";

interface IVideosTableProps {
  data: Video[];
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatDateTime = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const VideoActions = ({ video }: { video: Video }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete video "${video.title}"?`);

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteVideo(video.id);

      if (!result.success) {
        toast.error("Video was not deleted");
        return;
      }

      toast.success("Video deleted successfully");
      router.refresh();
    } catch {
      toast.error("Something went wrong deleting the video");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="ghost" size="icon" title="Open video">
        <a href={video.url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button asChild variant="ghost" size="icon" title="Edit video">
        <Link href={`/admin/videos/${video.id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Delete video"
        className="text-destructive hover:text-destructive"
        disabled={isDeleting}
        onClick={handleDelete}
      >
        <Trash className="size-4" />
      </Button>
    </div>
  );
};

const columns: ColumnDef<Video>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/admin/videos/${row.original.id}`} key={row.original.id}>
        <h3 className="font-semibold">{row.original.title}</h3>
      </Link>
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
        className="block max-w-80 truncate text-blue-500 underline-offset-4 hover:underline"
      >
        {row.original.url}
      </a>
    ),
  },
  {
    accessorKey: "videoDate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Video Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.getValue("videoDate") as Date),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Added Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => formatDateTime(row.getValue("createdAt") as Date),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <VideoActions video={row.original} />,
  },
];

export const VideosTable = ({ data }: IVideosTableProps) => (
  <div className="p-4 flex flex-col gap-2">
    <div className="text-sm text-muted-foreground">videos count: {data.length}</div>
    <DataTable data={data} columns={columns} />
  </div>
);

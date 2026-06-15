"use client";

import type { Video } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Copy, ExternalLink, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteVideo } from "@/app/_data/videos";

import { Badge, Button, DataTable } from "..";

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

const formatVisibility = (visibility: Video["visibility"]) => (visibility === "PUBLIC" ? "Public" : "Private");

const getVideoIdFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (hostname === "youtu.be") return pathParts[0] ?? null;

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (["shorts", "embed", "live"].includes(pathParts[0])) return pathParts[1] ?? null;
    }

    for (const parameter of ["video", "video_id", "id", "v"]) {
      const videoId = url.searchParams.get(parameter);
      if (videoId) return videoId;
    }

    return pathParts.at(-1) ?? null;
  } catch {
    return null;
  }
};

const VideoActions = ({ video }: { video: Video }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyId = async () => {
    const videoId = getVideoIdFromUrl(video.url);

    if (!videoId) {
      toast.error("Video ID was not found in the URL");
      return;
    }

    try {
      await navigator.clipboard.writeText(videoId);
      toast.success(`Video ID copied: ${videoId}`);
    } catch {
      toast.error("Video ID was not copied");
    }
  };

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
    <div className="flex w-36 items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" title="Open video">
        <a href={video.url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button variant="ghost" size="icon" title="Copy video ID" onClick={handleCopyId}>
        <Copy className="size-4" />
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
      <Link
        href={`/admin/videos/${row.original.id}`}
        key={row.original.id}
        className="block min-w-80 max-w-xl whitespace-normal wrap-anywhere"
      >
        <h3 className="font-semibold leading-snug">{row.original.title}</h3>
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
        className="block w-56 truncate text-blue-500 underline-offset-4 hover:underline"
      >
        {row.original.url}
      </a>
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
    accessorKey: "videoDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="w-28 justify-start"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Video Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="w-28 truncate" title={formatDate(row.getValue("videoDate") as Date)}>
        {formatDate(row.getValue("videoDate") as Date)}
      </div>
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
        Added Date
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
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <VideoActions video={row.original} />,
  },
];

export const VideosTable = ({ data }: IVideosTableProps) => (
  <div className="flex w-full min-w-0 max-w-full flex-col gap-2 p-4">
    <div className="text-sm text-muted-foreground">videos count: {data.length}</div>
    <DataTable data={data} columns={columns} />
  </div>
);

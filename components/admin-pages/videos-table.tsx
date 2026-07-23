"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Copy, ExternalLink, ImageIcon, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { deleteVideo, resolveAndSaveVideoThumbnail, type VideoWithChannel } from "@/app/_data/videos";
import { formatVideoDuration, formatVideoProvider } from "@/lib/video-metadata-format";
import { getYouTubeVideoId } from "@/lib/video-providers/youtube";

import { Badge, Button, DataTable, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "..";

interface IVideosTableProps {
  data: VideoWithChannel[];
}

const ADMIN_VIDEOS_PAGE_SIZE = 10;
const ALL_CHANNELS_VALUE = "__all_channels__";

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

const formatVisibility = (visibility: VideoWithChannel["visibility"]) =>
  visibility === "PUBLIC" ? "Public" : "Private";

const getVideoTags = (video: VideoWithChannel) => video.tags.map(({ tag }) => tag);

const VideoActions = ({ video }: { video: VideoWithChannel }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResolvingThumbnail, setIsResolvingThumbnail] = useState(false);

  const handleCopyId = async () => {
    const videoId = video.providerVideoId ?? getYouTubeVideoId(video.url);

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

  const handleResolveThumbnail = async () => {
    setIsResolvingThumbnail(true);

    try {
      const result = await resolveAndSaveVideoThumbnail(video.id);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Thumbnail URL saved");
      router.refresh();
    } catch {
      toast.error("Something went wrong saving the thumbnail URL");
    } finally {
      setIsResolvingThumbnail(false);
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
    <div className="flex w-44 items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" title="Open video">
        <a href={video.url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button variant="ghost" size="icon" title="Copy video ID" onClick={handleCopyId}>
        <Copy className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title={video.thumbnailUrl ? "Refresh thumbnail URL" : "Fetch thumbnail URL"}
        disabled={isResolvingThumbnail}
        onClick={handleResolveThumbnail}
      >
        <ImageIcon className="size-4" />
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

const columns: ColumnDef<VideoWithChannel>[] = [
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
    accessorKey: "provider",
    header: "Provider",
    cell: ({ row }) => {
      const provider = formatVideoProvider(row.original.provider);
      const duration = formatVideoDuration(row.original.durationSeconds);

      if (!provider && !row.original.providerVideoId && !duration) {
        return <span className="block w-24 truncate text-xs text-muted-foreground">No metadata</span>;
      }

      return (
        <div className="flex w-36 flex-col gap-1 text-xs">
          {provider ? (
            <Badge variant="outline" className="w-fit">
              {provider}
            </Badge>
          ) : null}
          {row.original.providerVideoId ? (
            <span className="truncate font-mono text-muted-foreground" title={row.original.providerVideoId}>
              {row.original.providerVideoId}
            </span>
          ) : null}
          {duration ? <span className="text-muted-foreground">{duration}</span> : null}
        </div>
      );
    },
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) =>
      row.original.channel ? (
        <Badge variant="outline" className="max-w-36 truncate">
          {row.original.channel.name}
        </Badge>
      ) : (
        <span className="block w-20 truncate text-xs text-muted-foreground">No channel</span>
      ),
  },
  {
    id: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = getVideoTags(row.original);

      if (tags.length === 0) {
        return <span className="block w-16 truncate text-xs text-muted-foreground">No tags</span>;
      }

      return (
        <div className="flex w-40 flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="max-w-36 truncate">
              {tag.name}
            </Badge>
          ))}
        </div>
      );
    },
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

export const VideosTable = ({ data }: IVideosTableProps) => {
  const [selectedChannelId, setSelectedChannelId] = useState(ALL_CHANNELS_VALUE);
  const channelOptions = useMemo(() => {
    const channels = new Map<string, NonNullable<VideoWithChannel["channel"]>>();

    data.forEach((video) => {
      if (video.channel) {
        channels.set(video.channel.id, video.channel);
      }
    });

    return Array.from(channels.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [data]);
  const filteredData = useMemo(
    () =>
      selectedChannelId === ALL_CHANNELS_VALUE ? data : data.filter((video) => video.channelId === selectedChannelId),
    [data, selectedChannelId],
  );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">videos count: {filteredData.length}</div>
        {channelOptions.length > 0 ? (
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-full sm:w-64" aria-label="Filter videos by channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CHANNELS_VALUE}>All channels</SelectItem>
              {channelOptions.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      <DataTable data={filteredData} columns={columns} pagination={{ pageSize: ADMIN_VIDEOS_PAGE_SIZE }} />
    </div>
  );
};

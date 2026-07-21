"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createLogEvent } from "@/app/_data/log";
import { createVideo, updateVideo } from "@/app/_data/videos";
import type { VideoChannel } from "@/generated/prisma/client";
import type { VideoVisibility } from "@/generated/prisma/enums";
import { formatVideoDuration, formatVideoProvider } from "@/lib/video-metadata-format";
import { isSupportedVideoThumbnailUrl } from "@/lib/video-thumbnail-url";
import { getYouTubeThumbnailUrl } from "@/lib/video-providers/youtube";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "..";

const videoVisibilityOptions = [
  { value: "PRIVATE", label: "Private" },
  { value: "PUBLIC", label: "Public" },
] as const satisfies { value: VideoVisibility; label: string }[];

const NO_CHANNEL_VALUE = "__no_channel__";

const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, { message: "Title is required" }),
  url: z.string().trim().url({ message: "Enter a valid URL" }),
  thumbnailUrl: z
    .string()
    .trim()
    .url({ message: "Enter a valid thumbnail URL" })
    .refine((value) => isSupportedVideoThumbnailUrl(value), {
      message: "Thumbnail URL must use a supported HTTPS image host",
    })
    .nullable()
    .optional()
    .or(z.literal("")),
  channelId: z.string().nullable().optional().or(z.literal("")),
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
  videoDate: z
    .string()
    .min(1, { message: "Video date is required" })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid video date",
    }),
});

export type VideoFormValues = z.infer<typeof formSchema>;

type VideoFormProps = Omit<Partial<VideoFormValues>, "videoDate"> & {
  channels?: VideoChannel[];
  videoDate?: Date | string;
  provider?: string | null;
  providerVideoId?: string | null;
  embedUrl?: string | null;
  durationSeconds?: number | null;
};

const formatDateInputValue = (date?: Date | string) => {
  if (!date) return new Date().toISOString().slice(0, 10);

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
};

export const VideoForm = ({
  id,
  title = "",
  url = "",
  thumbnailUrl: defaultThumbnailUrl = "",
  channelId = "",
  channels = [],
  videoDate,
  visibility = "PRIVATE",
  provider,
  providerVideoId,
  embedUrl,
  durationSeconds,
}: VideoFormProps) => {
  const router = useRouter();
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      title,
      url,
      thumbnailUrl: defaultThumbnailUrl ?? "",
      channelId: channelId ?? "",
      visibility,
      videoDate: formatDateInputValue(videoDate),
    },
    mode: "onBlur",
  });
  const thumbnailUrl = form.watch("thumbnailUrl");
  const previewThumbnailUrl = isSupportedVideoThumbnailUrl(thumbnailUrl) ? thumbnailUrl : null;
  const providerLabel = formatVideoProvider(provider);
  const durationLabel = formatVideoDuration(durationSeconds);
  const hasProviderMetadata = providerLabel || providerVideoId || embedUrl || durationLabel;

  const handleFetchThumbnail = () => {
    const resolvedThumbnailUrl = getYouTubeThumbnailUrl(form.getValues("url"));

    if (!resolvedThumbnailUrl) {
      toast.error("Thumbnail fetch supports YouTube watch, youtu.be, shorts, and embed URLs");
      return;
    }

    form.setValue("thumbnailUrl", resolvedThumbnailUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    toast.success("Thumbnail URL fetched");
  };

  const onSubmit = async (data: VideoFormValues) => {
    const values = { ...data, thumbnailUrl: data.thumbnailUrl || null, channelId: data.channelId || null };

    if (id) {
      await updateVideo(values);
      await createLogEvent("updateVideo", `Video updated: ${data.title}`);
      toast.success("Video updated successfully");
    } else {
      await createVideo(values);
      await createLogEvent("createVideo", `Video created: ${data.title}`);
      toast.success("Video created successfully");
    }

    router.refresh();
    router.push("/admin/videos");
  };

  return (
    <Form {...form}>
      <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail URL</FormLabel>
                {previewThumbnailUrl ? (
                  <a
                    href={previewThumbnailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block aspect-[4/3] w-full max-w-md overflow-hidden rounded-md border bg-muted"
                  >
                    <Image
                      src={previewThumbnailUrl}
                      alt={`${form.getValues("title") || "Video"} thumbnail`}
                      fill
                      sizes="(min-width: 768px) 28rem, calc(100vw - 2rem)"
                      className="object-cover"
                    />
                  </a>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="url" />
                  </FormControl>
                  <Button type="button" variant="secondary" className="cursor-pointer" onClick={handleFetchThumbnail}>
                    <ImageIcon className="size-4" />
                    Fetch
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={!thumbnailUrl}
                    onClick={() =>
                      form.setValue("thumbnailUrl", "", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <X className="size-4" />
                    Clear
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {hasProviderMetadata ? (
              <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <div className="font-medium">Provider metadata</div>
                {providerLabel ? <div className="text-muted-foreground">Provider: {providerLabel}</div> : null}
                {providerVideoId ? (
                  <div className="break-all font-mono text-xs text-muted-foreground">ID: {providerVideoId}</div>
                ) : null}
                {durationLabel ? <div className="text-muted-foreground">Duration: {durationLabel}</div> : null}
                {embedUrl ? (
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-xs text-blue-500 underline-offset-4 hover:underline"
                  >
                    {embedUrl}
                  </a>
                ) : null}
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {videoVisibilityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select
                    value={field.value || NO_CHANNEL_VALUE}
                    onValueChange={(value) => field.onChange(value === NO_CHANNEL_VALUE ? "" : value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CHANNEL_VALUE}>No channel</SelectItem>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-fit cursor-pointer"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? <Spinner className="size-6" /> : "Save changes"}
        </Button>
      </form>
    </Form>
  );
};

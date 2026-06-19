"use client";

import type { VideoChannel } from "@/generated/prisma/client";
import type { VideoChannelVisibility } from "@/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateVideoChannel } from "@/app/_data/video-channels";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const videoChannelVisibilityOptions = [
  { value: "PUBLIC", label: "Public" },
  { value: "HIDDEN", label: "Hidden" },
] as const satisfies { value: VideoChannelVisibility; label: string }[];

const formSchema = z.object({
  name: z.string().trim().min(2, { message: "Name is required" }),
  url: z.string().trim().url({ message: "Enter a valid URL" }),
  imageUrl: z.string().trim().url({ message: "Enter a valid image URL" }).optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "HIDDEN"]),
});

type VideoChannelEditFormValues = z.infer<typeof formSchema>;

const getDefaultValues = (channel: VideoChannel): VideoChannelEditFormValues => ({
  name: channel.name,
  url: channel.url,
  imageUrl: channel.imageUrl ?? "",
  visibility: channel.visibility,
});

export const VideoChannelEditDialog = ({ channel }: { channel: VideoChannel }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<VideoChannelEditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(channel),
    mode: "onBlur",
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    form.reset(getDefaultValues(channel));
  };

  const onSubmit = async (data: VideoChannelEditFormValues) => {
    await updateVideoChannel({
      id: channel.id,
      ...data,
      imageUrl: data.imageUrl || null,
    });

    toast.success("Channel updated successfully");
    router.refresh();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" variant="ghost" size="icon" title="Edit channel" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
      </Button>
      <DialogContent className="sm:max-w-lg" aria-describedby="video-channel-edit-description">
        <DialogHeader>
          <DialogTitle>Edit video channel</DialogTitle>
        </DialogHeader>
        <p id="video-channel-edit-description" className="sr-only">
          Edit this video channel.
        </p>

        <Form {...form}>
          <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      {videoChannelVisibilityOptions.map((option) => (
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

            <Button
              type="submit"
              className="w-fit cursor-pointer"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Spinner className="size-6" /> : "Save channel"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

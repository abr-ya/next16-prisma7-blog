"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createLogEvent } from "@/app/_data/log";
import { createVideo, updateVideo } from "@/app/_data/videos";
import { Button, Card, CardContent, CardHeader, CardTitle, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input, Spinner } from "..";

const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, { message: "Title is required" }),
  url: z.string().trim().url({ message: "Enter a valid URL" }),
  videoDate: z
    .string()
    .min(1, { message: "Video date is required" })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid video date",
    }),
});

export type VideoFormValues = z.infer<typeof formSchema>;

type VideoFormProps = Omit<Partial<VideoFormValues>, "videoDate"> & {
  videoDate?: Date | string;
};

const formatDateInputValue = (date?: Date | string) => {
  if (!date) return new Date().toISOString().slice(0, 10);

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
};

export const VideoForm = ({ id, title = "", url = "", videoDate }: VideoFormProps) => {
  const router = useRouter();
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      title,
      url,
      videoDate: formatDateInputValue(videoDate),
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: VideoFormValues) => {
    if (id) {
      await updateVideo(data);
      await createLogEvent("updateVideo", `Video updated: ${data.title}`);
      toast.success("Video updated successfully");
    } else {
      await createVideo(data);
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
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent>
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

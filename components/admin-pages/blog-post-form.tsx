"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { createBlogPost, updateBlogPost } from "@/app/_data/blogPosts";
import { createLogEvent } from "@/app/_data/log";
import { createSlug } from "@/lib/slug-generator";
import { MdRenderer } from "../blog-posts/md-renderer";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "..";

const formSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, { message: "Title is required" }),
  description: z.string().optional(),
  content: z.string().min(3, { message: "Content is required" }),
  slug: z.string().min(3, { message: "Slug is required" }),
});

export type BlogPostFormValues = z.infer<typeof formSchema>;

export const BlogPostForm = ({ id, title, description, content, slug }: BlogPostFormValues) => {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      title,
      description,
      content,
      slug,
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: BlogPostFormValues) => {
    if (id) {
      await updateBlogPost(data);
      await createLogEvent("updatePost", `MD Post updated: ${data.title}`);
      toast.success("Post updated successfully");
    } else {
      await createBlogPost(data);
      await createLogEvent("createPost", `MD Post created: ${data.title}`);
      toast.success("Post created successfully");
    }

    router.refresh();
    router.push("/md-posts");
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();

                      if (!form.getValues("slug")) {
                        form.setValue("slug", createSlug(e.target.value), {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <MdRenderer content={form.watch("content") || ""} />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content (Markdown)</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    className="w-full min-h-[300px] p-4 border rounded-md font-mono text-sm"
                    placeholder="# Write your markdown here..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="max-w-40 cursor-pointer"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
};

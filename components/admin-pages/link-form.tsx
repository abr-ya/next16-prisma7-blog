"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLinkDialog } from "@/hooks/index";
import z from "zod";
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
  Input,
  Spinner,
} from "..";
// import { createlink } from "@/app/_data/categories";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3, { message: "Name is required" }),
  description: z.string(),
  url: z.string().min(3, { message: "Url is required" }), // add url validation
});

type FormValues = z.infer<typeof formSchema>;

export const LinkForm = () => {
  const router = useRouter();
  const { link, open, setOpen, setLink } = useLinkDialog();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (link) {
      form.setValue("name", link.name);
    }
  }, [link, form]);

  const onSubmit = async ({ name, description, url }: FormValues) => {
    console.log("link name:", { name });
    if (link?.id) {
      console.log("updatelink({ id: link.id, name })");
      toast.success("link updated successfully");
    } else {
      console.log("createlink", { name, description, url });
      // await createlink(name);
      // toast.success("New link created successfully");
    }

    router.refresh();
    form.reset();
    setLink({ id: "", name: "", description: "", url: "" });
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>New link</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="link-form">
            <DialogContent className="sm:max-w-100" aria-describedby="link" aria-description="create link">
              <DialogHeader>
                <DialogTitle>{link ? "Edit link" : "Create link"}</DialogTitle>
              </DialogHeader>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Url</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="cursor-pointer"
                form="link-form"
                disabled={!form.formState.isValid || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? <Spinner className="size-6" /> : "Save changes"}
              </Button>
            </DialogContent>
          </form>
        </Form>
      </Dialog>
    </div>
  );
};

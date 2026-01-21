"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCategoryDialog } from "@/hooks/index";
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
import { createCategory } from "@/app/_data/categories";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3, { message: "Name is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export const CategoryForm = () => {
  const router = useRouter();
  const { category, open, setOpen, setCategory } = useCategoryDialog();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (category) {
      form.setValue("name", category.name);
    }
  }, [category, form]);

  const onSubmit = async ({ name }: FormValues) => {
    console.log("Category name:", { name });
    if (category?.id) {
      console.log("updateCategory({ id: category.id, name })");
      toast.success("Category updated successfully");
    } else {
      await createCategory(name);
      toast.success("New category created successfully");
    }

    router.refresh();
    form.reset();
    setCategory({ id: "", name: "" });
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Category</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="category-form">
            <DialogContent className="sm:max-w-100" aria-describedby="category" aria-description="create category">
              <DialogHeader>
                <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
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

              <Button
                type="submit"
                className="cursor-pointer"
                form="category-form"
                disabled={!form.formState.isValid || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? <Spinner className="size-6" /> : "Save changes"}
              </Button>
            </DialogContent>
          </form>
        </Form>
      </Dialog>
    </>
  );
};

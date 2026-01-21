"use client";

import { useCategoryDialog } from "@/hooks";
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
import z from "zod";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  name: z.string().min(3, { message: "Name is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export const CategoryForm = () => {
  const { category, open, setOpen } = useCategoryDialog();
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

  const onSubmit = async (data: FormValues) => {
    console.log("Category Data:", data);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Category Dialog</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="category-form">
            <DialogContent className="sm:max-w-100" aria-describedby="category" aria-description="create category">
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
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

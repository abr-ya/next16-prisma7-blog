"use client";

import { BlogPost } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button, DataTable } from "..";
import { ArrowUpDown } from "lucide-react";

interface IBlogPostsTableProps {
  data: BlogPost[];
}

const columns: ColumnDef<BlogPost>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/md-posts/${row.original.id}`} key={row.original.id}>
        <h3 className="font-semibold">{row.original.title}</h3>
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description || "—",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Created At
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) =>
      (row.getValue("createdAt") as Date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Updated At
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) =>
      (row.getValue("updatedAt") as Date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
];

export const BlogPostsTable = ({ data }: IBlogPostsTableProps) => {
  return (
    <div>
      MD posts count: {data.length}
      <DataTable data={data} columns={columns} />
    </div>
  );
};

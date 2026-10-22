"use client";

import { Post } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable, SortableHeader } from "..";

interface IPostsTableProps {
  data: Post[];
}

const columns: ColumnDef<Post>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <Link href={`/admin/posts/${row.original.id}`} key={row.original.id}>
        <h3 className="font-semibold">{row.original.title}</h3>
      </Link>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Created At" />,
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue("status"),
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => row.getValue("views"),
  },
];

export const PostsTable = ({ data }: IPostsTableProps) => {
  return (
    <div>
      posts count: {data.length}
      <DataTable data={data} columns={columns} />
    </div>
  );
};

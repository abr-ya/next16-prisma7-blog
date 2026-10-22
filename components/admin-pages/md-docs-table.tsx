"use client";

import type { MdDoc } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button, DataTable, SortableHeader } from "..";
import { ExternalLink } from "lucide-react";

interface IMdDocsTableProps {
  data: MdDoc[];
}

const columns: ColumnDef<MdDoc>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <Link href={`/admin/md-docs/${row.original.id}`} key={row.original.id}>
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
    accessorKey: "updatedAt",
    header: ({ column }) => <SortableHeader column={column} label="Updated At" />,
    cell: ({ row }) =>
      (row.getValue("updatedAt") as Date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end">
        <Button asChild variant="ghost" size="icon" title="Open document">
          <Link href={`/docs/${row.original.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
];

export const MdDocsTable = ({ data }: IMdDocsTableProps) => {
  return (
    <div>
      MD docs count: {data.length}
      <DataTable data={data} columns={columns} />
    </div>
  );
};

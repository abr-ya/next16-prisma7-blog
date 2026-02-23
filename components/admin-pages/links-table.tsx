"use client";

import { Link as Ilink } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button, DataTable } from "..";
import { ArrowUpDown } from "lucide-react";

interface ILinksTableProps {
  data: Ilink[];
}

const columns: ColumnDef<Ilink>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Title
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <h3 className="font-semibold">{row.original.name}</h3>,
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
    accessorKey: "url",
    header: "URL",
    cell: ({ row }) => <span className="text-blue-500">{row.getValue("url")}</span>,
  },
];

export const LinksTable = ({ data }: ILinksTableProps) => (
  <div>
    links count: {data.length}
    <DataTable data={data} columns={columns} />
  </div>
);

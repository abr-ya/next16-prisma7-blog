"use client";

import { Category } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Button, DataTable } from "..";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase"> {row.getValue("name")} </div>,
  },

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <div>{row.original.id}</div>,
  },
];

interface ICategoriesTableProps {
  categories: Category[];
}

export const CategoriesTable = ({ categories }: ICategoriesTableProps) => (
  <div className="p-8 flex flex-col">
    <DataTable data={categories} columns={columns} />
  </div>
);

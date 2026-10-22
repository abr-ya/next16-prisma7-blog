"use client";

import { Category } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "..";

import { CategoryControl } from "./category-control";

const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    cell: ({ row }) => <div className="lowercase"> {row.getValue("name")} </div>,
  },

  {
    id: "control",
    enableHiding: false,
    cell: ({ row }) => {
      return <CategoryControl name={row.original.name} id={row.original.id} />;
    },
  },
];

interface ICategoriesTableProps {
  categories: Category[];
}

export const CategoriesTable = ({ categories }: ICategoriesTableProps) => (
  <div className="p-4 flex flex-col">
    <DataTable data={categories} columns={columns} />
  </div>
);

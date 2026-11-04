"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTablePaginationOptions {
  pageSize: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: DataTablePaginationOptions;
  /** feature-129: the order the page already supplies, made visible in the headers. */
  initialSorting?: SortingState;
  /**
   * feature-132: changing this key returns the table to its first page without
   * touching the selected sort. Used when a filter switches between paginated
   * and unpaginated modes.
   */
  pageResetKey?: string | number;
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  pagination,
  initialSorting,
  pageResetKey,
}: DataTableProps<TData, TValue>) => {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pagination?.pageSize ?? data.length,
  });
  const isPaginated = Boolean(pagination);

  // feature-135 follow-up: TanStack memoizes `getPaginationRowModel` on the
  // table instance. Dropping the option later does not remove the memo, so a
  // table that starts paginated and then switches to "show everything" kept
  // slicing rows with the old page size. Keep the model installed and control
  // the state instead: unpaginated mode uses one page that holds every row.
  const effectivePagination: PaginationState = isPaginated
    ? paginationState
    : { pageIndex: 0, pageSize: Math.max(data.length, 1) };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { pagination: effectivePagination },
    onPaginationChange: isPaginated ? setPaginationState : undefined,
    initialState: initialSorting ? { sorting: initialSorting } : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });
  const pageCount = Math.max(table.getPageCount(), 1);

  useEffect(() => {
    table.setPageIndex(0);
    // feature-132: only the reset key should trigger this; including `table`
    // would reset the page on every render and break the pagination buttons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageResetKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {isPaginated ? (
        <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Previous page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Next page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

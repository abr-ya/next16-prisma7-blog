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
import { useT } from "next-i18next/client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { commonNamespace } from "@/app/i18n/settings";
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
   * feature-130: the page-supplied order this table falls back to when no
   * column sort is active. Pass one already-localized sentence that names the
   * same order the page renders, for example `Sorted by: recently updated`.
   * The hint is plain text and never changes sorting, row order, or
   * pagination. A table whose order has no sortable column can pass this
   * alone; a table with a declared initial sort passes it so the cleared
   * state is explained too.
   */
  defaultSortHint?: string;
  /**
   * feature-130: formats the always-visible sort status for an active column
   * sort. Receives the localized column label and the direction; return the
   * complete sentence. The table falls back to `defaultSortHint` when no
   * column sort is active.
   */
  formatSortStatus?: (label: string, descending: boolean) => string;
  /**
   * feature-130: page-level controls that belong with the table. Rendered to
   * the right of the fallback-order hint in the same row above the table
   * header, so the page's primary action sits on the hint's line instead of
   * one row above it. Pass a localized node; the table only lays it out.
   */
  headerActions?: ReactNode;
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
  defaultSortHint,
  formatSortStatus,
  headerActions,
  pageResetKey,
}: DataTableProps<TData, TValue>) => {
  const { t } = useT(commonNamespace);
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
  // feature-130: name the current sort when one is active, and the page-supplied
  // order otherwise. The column label comes from `meta.sortLabel`, because the
  // rendered header is a component rather than a plain string.
  const activeSort = table.getState().sorting[0];
  const activeSortLabel = activeSort
    ? ((table.getColumn(activeSort.id)?.columnDef.meta as { sortLabel?: string } | undefined)?.sortLabel ??
      activeSort.id)
    : null;
  const sortStatusText =
    activeSort && activeSortLabel && formatSortStatus
      ? formatSortStatus(activeSortLabel, activeSort.desc)
      : defaultSortHint;

  useEffect(() => {
    table.setPageIndex(0);
    // feature-132: only the reset key should trigger this; including `table`
    // would reset the page on every render and break the pagination buttons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageResetKey]);

  return (
    <div className="flex flex-col gap-3">
      {sortStatusText || headerActions ? (
        <div className="flex flex-wrap items-center gap-2">
          {sortStatusText ? <p className="mr-auto text-sm text-muted-foreground">{sortStatusText}</p> : null}
          {headerActions ? (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{headerActions}</div>
          ) : null}
        </div>
      ) : null}
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
                  {t("dataTable.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {isPaginated ? (
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>{t("dataTable.pageOf", { page: table.getState().pagination.pageIndex + 1, count: pageCount })}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={t("dataTable.previousPage")}
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={t("dataTable.nextPage")}
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

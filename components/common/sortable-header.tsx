"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

// refactor-002: the sortable-column header that 19 admin table sites each
// carried as inline JSX. The verification sweep behind this extraction found
// all 19 byte-identical apart from the label text and, at 5 of them, a width
// `className` — see `openspec/changes/refactor-002-sortable-header/design.md`.
//
// The component deliberately keeps no sort-direction-aware icon and copies
// `toggleSorting(column.getIsSorted() === "asc")` verbatim so the sort cycle is
// unchanged from the inline JSX this replaced. That cycle is two-state —
// unsorted → asc → desc → asc — because passing an explicit boolean sets
// `hasManualValue` in TanStack's RowSorting, which skips the branch that can
// remove a sort. The argument-less `toggleSorting()` would give a true
// three-state cycle, but that is a user-visible change across every sortable
// header and is tracked separately; see
// `openspec/backlog.md` → `admin-sortable-header-third-click-no-unsorted`.
//
// `className` is load-bearing, not decorative. Five sites pin their header to
// `w-36` / `w-28 justify-start`; dropping the prop would collapse those
// headers and change column widths, which is a visible behavior change and
// would forfeit this change's place in the `refactor-XXX` pool.
type SortableHeaderProps<TData> = {
  column: Column<TData, unknown>;
  label: string;
  className?: string;
};

const SortableHeader = <TData,>({ column, label, className }: SortableHeaderProps<TData>) => (
  <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className={className}>
    {label}
    <ArrowUpDown />
  </Button>
);

export { SortableHeader };
export type { SortableHeaderProps };

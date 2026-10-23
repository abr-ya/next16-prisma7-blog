"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

// refactor-002: the sortable-column header that 19 admin table sites each
// carried as inline JSX. The verification sweep behind this extraction found
// all 19 byte-identical apart from the label text and, at 5 of them, a width
// `className` — see
// `openspec/changes/archive/2026-10-21-refactor-002-sortable-header/design.md`.
//
// feature-119: the glyph now reflects the column's actual sort state — `ArrowUp`
// for ascending, `ArrowDown` for descending, and the neutral `ArrowUpDown` when
// the column is unsorted, which is also where a cleared sort lands.
//
// fix-006: the click handler calls `toggleSorting()` with no argument, so the
// sort cycle is three-state — unsorted → asc → desc → unsorted. Passing an
// explicit boolean set `hasManualValue` in TanStack's RowSorting, which skipped
// the branch that can remove a sort and left the cycle stuck at two states. The
// argument-less call lets the library own the cycle: the third click clears the
// sort, the table returns to its original row order, and a fourth click starts
// the cycle over.
//
// `className` is load-bearing, not decorative. Five sites pin their header to
// `w-36` / `w-28 justify-start`; dropping the prop would collapse those
// headers and change column widths, which is a visible behavior change and
// would forfeit a change's place in the `refactor-XXX` pool.
type SortableHeaderProps<TData> = {
  column: Column<TData, unknown>;
  label: string;
  className?: string;
};

const SortableHeader = <TData,>({ column, label, className }: SortableHeaderProps<TData>) => {
  const sorted = column.getIsSorted();
  const SortGlyph = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button variant="ghost" onClick={() => column.toggleSorting()} className={className}>
      {label}
      <SortGlyph />
    </Button>
  );
};

export { SortableHeader };
export type { SortableHeaderProps };

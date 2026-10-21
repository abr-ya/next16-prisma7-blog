# Design

## The audit that unblocked this

The condition attached when this candidate was split out of `refactor-001` was to verify every possible site before extracting, because research-001 had checked 3 and a sweep had suggested 10.

Verification ran on 2026-10-21 as a hash sweep over every `toggleSorting` occurrence under `components/` — not just `components/admin-pages/`, so the audit scope is the whole component tree. Result: **19 sites in 10 files, collapsing to 10 distinct shapes.** Every pair of sites differs only in the label string and, at 5 of them, a width `className`. There is no `sortingFn`, no sort-direction-aware icon swap, no disabled state, and no i18n wrapper anywhere in the set — all 19 labels are bare English literals.

Line numbers below are as of the working tree with `refactor-001-delete-row-confirm` applied, so the outdoor panel numbers will shift by a few lines once that branch lands.

| File | header lines | label | className |
| --- | --- | --- | --- |
| `categories-table.tsx` | 12-16 | Name | — |
| `files-table.tsx` | 182-186 | Name | — |
| `files-table.tsx` | 273-281 | Uploaded | `w-36 justify-start` |
| `hikes-admin-panel.tsx` | 1094-1098 | Title | — |
| `links-table.tsx` | 15-19 | Title | — |
| `links-table.tsx` | 25-29 | Created At | — |
| `md-docs-table.tsx` | 16-20 | Title | — |
| `md-docs-table.tsx` | 35-39 | Created At | — |
| `md-docs-table.tsx` | 52-56 | Updated At | — |
| `photos-admin-panel.tsx` | 736-740 | Title | — |
| `posts-table.tsx` | 16-20 | Title | — |
| `posts-table.tsx` | 30-34 | Created At | — |
| `tracks-admin-columns.tsx` | 60-64 | Title | — |
| `video-channels-table.tsx` | 93-97 | Name | — |
| `video-channels-table.tsx` | 147-155 | Created | `w-36 justify-start` |
| `video-channels-table.tsx` | 165-173 | Updated | `w-36 justify-start` |
| `videos-table.tsx` | 169-173 | Title | — |
| `videos-table.tsx` | 271-279 | Video Date | `w-28 justify-start` |
| `videos-table.tsx` | 289-297 | Added Date | `w-36 justify-start` |

14 sites carry no `className`; 5 do.

## Where the component lives

`components/common/sortable-header.tsx`, exported from `components/index.ts` alongside `ConfirmDialog`, `DataTable`, and `SimpleSelect`.

The barrel export is the reason for that choice. All 10 consumer files already import from the barrel — seven as `from ".."` (`categories-table`, `files-table`, `links-table`, `md-docs-table`, `posts-table`, `video-channels-table`, `videos-table`) and three as `from "@/components/index"` (`hikes-admin-panel`, `photos-admin-panel`, `tracks-admin-columns`). Adding the export to the barrel means **no file needs a new import path**; each just gains one more named specifier in a barrel import it already has. A component placed anywhere else would need a fresh import line in all 10.

`"use client"` on line 1 matches every other `components/common/` client component (`confirm-dialog.tsx`, `data-table.tsx`). It is not strictly required — all 10 consumers are already client modules — but a `common/` component without it would be the odd one out.

## The component

```tsx
"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

type SortableHeaderProps<TData> = {
  column: Column<TData, unknown>;
  label: string;
  className?: string;
};

const SortableHeader = <TData,>({ column, label, className }: SortableHeaderProps<TData>) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    className={className}
  >
    {label}
    <ArrowUpDown />
  </Button>
);

export { SortableHeader };
export type { SortableHeaderProps };
```

**Why generic over `Column<any, unknown>`.** A single-arity `any` in the prop type would be the shortest signature and would sidestep inference entirely, but it discards the row type at every call site for no benefit. `<TData,>` infers from the surrounding `ColumnDef<TData>[]` `useMemo`, so `column.toggleSorting` stays type-checked and the trailing comma is required to disambiguate from JSX in a `.tsx` file.

**Why `label: string` and not `children: ReactNode`.** All 19 labels are plain literals. A `ReactNode` children prop would accept a `<Badge>` or an icon for a hypothetical future column, which is speculative generality for a component with exactly 19 known call sites. If a non-string label ever appears, widening the prop then is a one-line change.

**Why no `size` prop.** All 19 use `Button`'s default size. None passes `size`, `asChild`, `disabled`, or any other `Button` prop.

**The `<Button>` prop order in the JSX above does not match the 5 multi-line sites** (which put `className` before `onClick`). Attribute order does not affect rendered output, so this is cosmetic.

## The `className` requirement — the one silent behavior change to avoid

The component **must** accept `className`. Five sites pin their header to a fixed width:

| Site | className |
| --- | --- |
| `files-table.tsx:273` (Uploaded) | `w-36 justify-start` |
| `video-channels-table.tsx:147` (Created) | `w-36 justify-start` |
| `video-channels-table.tsx:165` (Updated) | `w-36 justify-start` |
| `videos-table.tsx:271` (Video Date) | `w-28 justify-start` |
| `videos-table.tsx:289` (Added Date) | `w-36 justify-start` |

A component without that prop would drop the width on all five, the header button would collapse to its content width, and the `Ghost` variant's `inline-flex` centering would shift those labels. That is a visible layout change, and it would make this change ineligible for the `refactor-XXX` pool under the hybrid rule.

The obvious "cleanup" — normalizing the five to no `className`, or making them all `w-36` — is the same mistake in the other direction. Leave the values exactly as they are and pass them through.

**Passing `className={undefined}` at the other 14 sites is safe.** `Button` forwards it into `cn(buttonVariants({ variant, size, className }))`, and both `cva` and `cn` drop falsy values, so an explicit `undefined` produces the identical class string as omitting the attribute. No need for 14 conditional call sites.

## Sorting semantics to preserve exactly

```tsx
onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
```

This is TanStack's three-state idiom: unsorted → asc → desc → unsorted. The `=== "asc"` comparison is what returns to unsorted on the third click. Replacing it with `toggleSorting()` (no argument) would make the third click cycle asc → desc → asc with no way back to the original order, and replacing it with `toggleSorting(true)` would make every click force ascending. Neither is a refactor. Copy the expression verbatim.

Note also that `ArrowUpDown` is a **static** icon — none of the 19 sites swaps it for `ArrowUp`/`ArrowDown` based on `getIsSorted()`. Do not "improve" it into a direction-aware icon as part of this change; that is a user-visible addition and belongs to a `feature-XXX`.

## Cell renderers stay per-table

Only the header block is duplicated. The `cell` immediately under each header is table-specific — tracks renders a `<Link>`, hikes and photos a plain `<div>`, videos a channel list, files a size and mime line. Nothing there is shared, so the conversion stops at `header`.

## Import fallout

`ArrowUpDown` is imported from `lucide-react` in all 10 files and is used **only** inside these headers — each file's occurrence count is exactly its site count plus one for the import itself. After conversion all 10 imports become unused and ESLint's `no-unused-vars` will flag them. Remove `ArrowUpDown` from the `lucide-react` import in all 10 files in the same change, not as a follow-up.

## React Compiler and the memoized column defs

`tracks-admin-columns.tsx`, `photos-admin-panel.tsx`, and `hikes-admin-panel.tsx` build their column arrays inside `useMemo`. The call-site shape stays the same as today — an inline arrow returning JSX — so the compiler's dependency inference is unchanged. The one thing to watch is that no memo dependency array starts referencing `SortableHeader`; it is a module-scope component, not a value produced by a render, so it must stay out.

## Explicitly out of scope

- **Adding `Updated` sorting to the photos, hikes, and tracks panels.** User-visible; a separate `feature-XXX`.
- **Making the icon direction-aware.** User-visible; a separate `feature-XXX`.
- **Touching the `cell:` renderers** under any of the 19 headers.
- **Normalizing the 5 width values.**
- **Refactoring `DataTable` itself.** `components/common/data-table.tsx` already wires `getSortedRowModel` for all consumers and needs no change.

## Risks

| Risk | Mitigation |
| --- | --- |
| Dropping the width `className` at 5 sites, silently changing layout | The prop is part of the contract; the 5 call sites are enumerated above and in `tasks.md` |
| "Cleaning up" the 5 widths to a single value | Explicitly listed as a non-goal; any width change is a visible change |
| Changing `toggleSorting(...)` to the argument-less form | Called out in the semantics section; the third-click reset is the behavior at risk |
| Adding an ascending/descending icon swap while in the file | Explicitly out of scope; it is a feature, not a refactor |
| Forgetting the `ArrowUpDown` import removal | Listed as its own task section with all 10 files |
| Widening `cell:` renderers opportunistically | Stop the edit at `header` |
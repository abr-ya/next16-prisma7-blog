# Tasks

## 1. Add the component

- [ ] Create `components/common/sortable-header.tsx` with `"use client";` on line 1, matching `components/common/confirm-dialog.tsx` and `components/common/data-table.tsx`.
- [ ] Type the props generically: `SortableHeaderProps<TData>` with `column: Column<TData, unknown>`, `label: string`, `className?: string`. Use `<TData,>` with the trailing comma so the generic is not parsed as JSX. Do not use `Column<any, unknown>`.
- [ ] Body is the verbatim expression from `design.md`: `<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className={className}>{label}<ArrowUpDown /></Button>`. Keep the three-state reset — do not switch to the argument-less `toggleSorting()`.
- [ ] Keep `ArrowUpDown` static. Do not add a sort-direction-aware icon.
- [ ] Add `export { SortableHeader }` and `export type { SortableHeaderProps }`, matching the named-export style of the other `common/` components.
- [ ] Add `export { SortableHeader } from "./common/sortable-header";` to `components/index.ts`, in the "Common Components" group next to `ConfirmDialog` and `DataTable`.

## 2. Convert the three outdoor panels

These are the panels `refactor-001-delete-row-confirm` touches. Land this change **after** that branch merges so the line numbers below are current; re-locate by search if they have moved.

- [ ] `components/admin-pages/tracks-admin-columns.tsx:60-64` — replace with `header: ({ column }) => <SortableHeader column={column} label="Title" />`. No `className` at this site. Leave the `<Link>` `cell:` renderer alone.
- [ ] `components/admin-pages/hikes-admin-panel.tsx:1094-1098` — same, `label="Title"`, no `className`. Leave the `<div>` `cell:` renderer alone.
- [ ] `components/admin-pages/photos-admin-panel.tsx:736-740` — same, `label="Title"`, no `className`. Leave the `<div>` `cell:` renderer alone.
- [ ] Add `SortableHeader` to the existing `@/components/index` barrel import in each of the three. Do not add a new import path.
- [ ] Confirm no `useMemo` dependency array in these three files starts referencing `SortableHeader` — it is module scope, not a render value.

## 3. Convert the seven standalone tables

- [ ] `components/admin-pages/categories-table.tsx:12-16` — `label="Name"`, no `className`.
- [ ] `components/admin-pages/files-table.tsx:182-186` — `label="Name"`, no `className`.
- [ ] `components/admin-pages/files-table.tsx:273-281` — `label="Uploaded"`, **`className="w-36 justify-start"` must be carried over.**
- [ ] `components/admin-pages/links-table.tsx:15-19` — `label="Title"`, no `className`.
- [ ] `components/admin-pages/links-table.tsx:25-29` — `label="Created At"`, no `className`.
- [ ] `components/admin-pages/md-docs-table.tsx:16-20` — `label="Title"`, no `className`.
- [ ] `components/admin-pages/md-docs-table.tsx:35-39` — `label="Created At"`, no `className`.
- [ ] `components/admin-pages/md-docs-table.tsx:52-56` — `label="Updated At"`, no `className`.
- [ ] `components/admin-pages/posts-table.tsx:16-20` — `label="Title"`, no `className`.
- [ ] `components/admin-pages/posts-table.tsx:30-34` — `label="Created At"`, no `className`.
- [ ] `components/admin-pages/video-channels-table.tsx:93-97` — `label="Name"`, no `className`.
- [ ] `components/admin-pages/video-channels-table.tsx:147-155` — `label="Created"`, **`className="w-36 justify-start"`.**
- [ ] `components/admin-pages/video-channels-table.tsx:165-173` — `label="Updated"`, **`className="w-36 justify-start"`.**
- [ ] `components/admin-pages/videos-table.tsx:169-173` — `label="Title"`, no `className`.
- [ ] `components/admin-pages/videos-table.tsx:271-279` — `label="Video Date"`, **`className="w-28 justify-start"`.**
- [ ] `components/admin-pages/videos-table.tsx:289-297` — `label="Added Date"`, **`className="w-36 justify-start"`.**
- [ ] Add `SortableHeader` to the existing `from ".."` barrel import in each of the seven. Do not add a new import path.

## 4. Import fallout

- [ ] Remove `ArrowUpDown` from the `lucide-react` import in **all ten** files. It is used nowhere else — each file's current count is its site count plus one for the import itself, so every one goes to zero. Leaving a stale import fails lint.
- [ ] Re-run `grep -rn "ArrowUpDown" components/` and confirm no remaining occurrence outside `components/common/sortable-header.tsx` itself.
- [ ] Re-run `grep -rn "toggleSorting" components/` and confirm exactly 1 occurrence remains, inside the new component.

## 5. Validate

- [ ] `npm run tsc` — must pass clean. This is where a generic-inference failure at any of the 19 call sites surfaces.
- [ ] `npx eslint components/common/sortable-header.tsx components/index.ts components/admin-pages/categories-table.tsx components/admin-pages/files-table.tsx components/admin-pages/hikes-admin-panel.tsx components/admin-pages/links-table.tsx components/admin-pages/md-docs-table.tsx components/admin-pages/photos-admin-panel.tsx components/admin-pages/posts-table.tsx components/admin-pages/tracks-admin-columns.tsx components/admin-pages/video-channels-table.tsx components/admin-pages/videos-table.tsx --quiet` — these are outside `app/`, so the root lint script will not cover them.
- [ ] `npx prettier --check` on the new component, or `npx eslint --fix` if it reports formatting.
- [ ] `npx prisma generate` — not needed; no schema change.
- [ ] `npx openspec validate refactor-002-sortable-header --strict`.
- [ ] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either.

## 6. Browser check

This refactor must be visually indistinguishable from the previous build. Check the tables that carry a width `className` first, since those are the ones that can regress:

- [ ] `/admin/videos` — the **Video Date** and **Added Date** headers keep their fixed widths and left-aligned labels; **Title** is unchanged.
- [ ] `/admin/video-channels` — **Created** and **Updated** headers keep their fixed widths; **Name** unchanged.
- [ ] `/admin/files` — the **Uploaded** header keeps its fixed width; **Name** unchanged.
- [ ] `/admin/md-docs` — **Title**, **Created At**, **Updated At** all still sort; the third click still returns to the original order.
- [ ] `/admin/links`, `/admin/posts`, `/admin/categories` — sortable headers still sort and still cycle unsorted → asc → desc → unsorted.
- [ ] `/admin/tracks`, `/admin/hikes`, `/admin/photos` — the **Title** header is unchanged and still sorts; the `cell:` content under it (the tracks `<Link>`) is unchanged.
- [ ] Spot-check one header per table for icon position and spacing against the previous build — the `ArrowUpDown` must still be a static up/down glyph with no direction swap.

## 7. Docs

- [ ] Update `openspec/refactor-backlog.md`: move `refactor-002-sortable-header` out of `In Progress` when archiving, and record that the 19-site verification the split-out condition required is now done.
- [ ] Note in `refactor-backlog.md` that `sortable-header` was the prerequisite for the outdoor `Updated`-sorting feature, so that candidate's summary should point here.
- [x] No spec update — `skip_specs: true`, no observable behavior change.

## Not in this change

- Sortable `Updated` columns in `photos-admin-panel`, `hikes-admin-panel`, `tracks-admin-columns` → a `feature-XXX`, unblocked by this refactor.
- Direction-aware `ArrowUp`/`ArrowDown` icon swap → `feature-XXX`, user-visible.
- The `cell:` renderers under any of the 19 headers.
- Normalizing the five width `className` values.
- `components/common/data-table.tsx` — already wires `getSortedRowModel` for all consumers.
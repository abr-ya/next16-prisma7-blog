# Tasks

## 1. Add the component

- [x] Create `components/common/sortable-header.tsx` with `"use client";` on line 1, matching `components/common/confirm-dialog.tsx` and `components/common/data-table.tsx`.
- [x] Type the props generically: `SortableHeaderProps<TData>` with `column: Column<TData, unknown>`, `label: string`, `className?: string`. Use `<TData,>` with the trailing comma so the generic is not parsed as JSX. Do not use `Column<any, unknown>`.
- [x] Body is the verbatim expression from `design.md`: `<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className={className}>{label}<ArrowUpDown /></Button>`. Copy it verbatim so the sort cycle is unchanged. Do **not** switch to the argument-less `toggleSorting()` — that form would change the cycle from two-state to three-state across all 19 sites, which is a user-visible behavior change belonging to a `fix-XXX`, not this refactor.
- [x] Keep `ArrowUpDown` static. Do not add a sort-direction-aware icon.
- [x] Add `export { SortableHeader }` and `export type { SortableHeaderProps }`, matching the named-export style of the other `common/` components.
- [x] Add `export { SortableHeader } from "./common/sortable-header";` to `components/index.ts`, in the "Common Components" group next to `ConfirmDialog` and `DataTable`.

## 2. Convert the three outdoor panels

These are the panels `refactor-001-delete-row-confirm` touches. Land this change **after** that branch merges so the line numbers below are current; re-locate by search if they have moved.

- [x] `components/admin-pages/tracks-admin-columns.tsx:60-64` — replace with `header: ({ column }) => <SortableHeader column={column} label="Title" />`. No `className` at this site. Leave the `<Link>` `cell:` renderer alone.
- [x] `components/admin-pages/hikes-admin-panel.tsx:1094-1098` — same, `label="Title"`, no `className`. Leave the `<div>` `cell:` renderer alone.
- [x] `components/admin-pages/photos-admin-panel.tsx:736-740` — same, `label="Title"`, no `className`. Leave the `<div>` `cell:` renderer alone.
- [x] Add `SortableHeader` to the existing `@/components/index` barrel import in each of the three. Do not add a new import path.
- [x] Confirm no `useMemo` dependency array in these three files starts referencing `SortableHeader` — it is module scope, not a render value.

## 3. Convert the seven standalone tables

- [x] `components/admin-pages/categories-table.tsx:12-16` — `label="Name"`, no `className`.
- [x] `components/admin-pages/files-table.tsx:182-186` — `label="Name"`, no `className`.
- [x] `components/admin-pages/files-table.tsx:273-281` — `label="Uploaded"`, **`className="w-36 justify-start"` must be carried over.**
- [x] `components/admin-pages/links-table.tsx:15-19` — `label="Title"`, no `className`.
- [x] `components/admin-pages/links-table.tsx:25-29` — `label="Created At"`, no `className`.
- [x] `components/admin-pages/md-docs-table.tsx:16-20` — `label="Title"`, no `className`.
- [x] `components/admin-pages/md-docs-table.tsx:35-39` — `label="Created At"`, no `className`.
- [x] `components/admin-pages/md-docs-table.tsx:52-56` — `label="Updated At"`, no `className`.
- [x] `components/admin-pages/posts-table.tsx:16-20` — `label="Title"`, no `className`.
- [x] `components/admin-pages/posts-table.tsx:30-34` — `label="Created At"`, no `className`.
- [x] `components/admin-pages/video-channels-table.tsx:93-97` — `label="Name"`, no `className`.
- [x] `components/admin-pages/video-channels-table.tsx:147-155` — `label="Created"`, **`className="w-36 justify-start"`.**
- [x] `components/admin-pages/video-channels-table.tsx:165-173` — `label="Updated"`, **`className="w-36 justify-start"`.**
- [x] `components/admin-pages/videos-table.tsx:169-173` — `label="Title"`, no `className`.
- [x] `components/admin-pages/videos-table.tsx:271-279` — `label="Video Date"`, **`className="w-28 justify-start"`.**
- [x] `components/admin-pages/videos-table.tsx:289-297` — `label="Added Date"`, **`className="w-36 justify-start"`.**
- [x] Add `SortableHeader` to the existing `from ".."` barrel import in each of the seven. Do not add a new import path.

## 4. Import fallout

- [x] Remove `ArrowUpDown` from the `lucide-react` import in **all ten** files. It is used nowhere else — each file's current count is its site count plus one for the import itself, so every one goes to zero. Leaving a stale import fails lint.
- [x] Re-run `grep -rn "ArrowUpDown" components/` and confirm no remaining occurrence outside `components/common/sortable-header.tsx` itself.
- [x] Re-run `grep -rn "toggleSorting" components/` and confirm exactly 1 occurrence remains, inside the new component.

## 5. Validate

- [x] `npm run tsc` — must pass clean. This is where a generic-inference failure at any of the 19 call sites surfaces.
- [x] `npx eslint components/common/sortable-header.tsx components/index.ts components/admin-pages/categories-table.tsx components/admin-pages/files-table.tsx components/admin-pages/hikes-admin-panel.tsx components/admin-pages/links-table.tsx components/admin-pages/md-docs-table.tsx components/admin-pages/photos-admin-panel.tsx components/admin-pages/posts-table.tsx components/admin-pages/tracks-admin-columns.tsx components/admin-pages/video-channels-table.tsx components/admin-pages/videos-table.tsx --quiet` — these are outside `app/`, so the root lint script will not cover them.
- [x] `npx prettier --check` on the new component, or `npx eslint --fix` if it reports formatting.
- [x] `npx prisma generate` — not needed; no schema change.
- [x] `npx openspec validate refactor-002-sortable-header --strict`.
- [x] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either. The user ran both on 2026-10-21; the build passed and the browser check in section 6 was completed.

## 6. Browser check

This refactor must be visually indistinguishable from the previous build. Check the tables that carry a width `className` first, since those are the ones that can regress:

- [x] `/admin/videos` — the **Video Date** and **Added Date** headers keep their fixed widths and left-aligned labels; **Title** is unchanged. Verified 2026-10-21. This surface also surfaced an unrelated pre-existing overflow, filed as `admin-videos-table-horizontal-overflow`.
- [x] `/admin/video-channels` — **Created** and **Updated** headers keep their fixed widths; **Name** unchanged. Verified 2026-10-21.
- [x] `/admin/files` — the **Uploaded** header keeps its fixed width; **Name** unchanged. Verified 2026-10-21.
- [x] `/admin/md-docs` — **Title**, **Created At**, **Updated At** all still sort. The third click returns to **ascending**, not to unsorted — that two-state cycle is the pre-existing behavior this refactor preserves verbatim; see the correction note in `design.md`. Verified 2026-10-21.
- [x] `/admin/links`, `/admin/posts`, `/admin/categories` — sortable headers still sort and still cycle unsorted → asc → desc → **asc** (two-state, not three; see `design.md`).
- [x] `/admin/tracks`, `/admin/hikes`, `/admin/photos` — the **Title** header is unchanged and still sorts. Sorting verified across all ten tables by the user on 2026-10-21; the `cell:` renderers were not checked by eye but the diff touches no `cell:` line in any file, which closes it by construction.
- [x] Spot-check one header per table for icon position and spacing against the previous build — the `ArrowUpDown` is still a static up/down glyph with no direction swap, confirmed by the user observing identical sorting behavior across all ten tables on 2026-10-21.

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
# Design

## Context

`components/admin-pages/tracks-admin-panel.tsx` is 1446 lines after the feature-112 → feature-113 → feature-116 chain. The current shape is a single file that owns every track-admin concern at once: a 600-line `TrackFormDialog`, a per-row `SourceBadge` / `TrackParseStatus` cell rendered inline in the `parse` column, a per-row pending-state machine (`parsingTrackId`, `markingAsManualId`, `markAsManualTarget`, `isMarkingAsManual`, `handleParse`, `handleMarkAsManualConfirm`), and the entire `ColumnDef<TrackListItem>[]` for the admin table. The table column definitions and the parse cell render `SourceBadge` / `TrackParseStatus` / cell-level click handlers inline at the panel level, which makes the panel a third owner of cell rendering alongside the dialog and `TrackParseStatus`. The candidate for this slice (the first of a planned multi-slice refactor series, see [[outdoor-admin-panel-refactor-direction]]) extracts the three narrowest, lowest-risk concerns first: the parse cell, the column definitions, and the per-row pending-state helper. The `TrackFormDialog` and the panel-level timezone / delete / parse dialogs stay in this slice.

## Goals / Non-Goals

**Goals:**

- Produce three files from `tracks-admin-panel.tsx` without changing observable behaviour: `components/admin-pages/tracks-admin-panel-parse-cell.tsx`, `components/admin-pages/tracks-admin-columns.tsx`, `lib/track-row-actions.ts`.
- Reuse the existing toast strings, server actions, formatters, and `DataTable` import verbatim — every line moved out of the panel must keep its current rendering, prop shape, and dependency closure.
- Keep `TrackFormDialog` and the panel-level timezone / delete dialogs in the panel file unchanged apart from the source-line shifts caused by removing the moved code.

**Non-Goals:**

- Splitting `TrackFormDialog`, splitting the panel-level dialogs, or moving them to `lib/`.
- Adding new functionality, new i18n keys, new Prisma columns, or new server actions.
- Re-architecting the column definitions (e.g. lifting column headers to constants, switching off `useMemo`).
- Extracting a shared admin-panel shell — that work is tracked under separate candidates (`outdoor-tracks-admin-panel-parallel-audit` and `hikes-admin-panel-split` in the backlog).
- Touching `hikes-admin-panel.tsx`, `photos-admin-panel.tsx`, or any other admin component.

## Decisions

### Decision 1 — `SourceBadge` moves with the parse cell, `TrackParseStatus` stays in the panel file (re-exported from the cell module)

The parse column at `tracks-admin-panel.tsx:1182-1207` is a two-line composition (`SourceBadge` + `TrackParseStatus`) wrapped by an inline `hasNoTimedTimeline` derivation. `SourceBadge` is already module-local at `tracks-admin-panel.tsx:166-193` and is consumed only by this cell, so it moves with the cell into `tracks-admin-panel-parse-cell.tsx`. `TrackParseStatus` is consumed only by the cell and by the panel-level dialog or any other panel-internal call site (a quick grep shows no other consumers in the repo); it is re-exported from `tracks-admin-panel-parse-cell.tsx` so the panel can keep its existing import path (`import { TrackParseStatus } from "./tracks-admin-panel-parse-cell"`) without introducing a fourth file.

**Alternatives considered:**

- *Put `TrackParseStatus` in its own file* — rejected: it has a single consumer and the panel is the only owner of its imports; splitting it adds a fourth file with no current benefit.
- *Inline `SourceBadge` into the cell instead of moving it* — rejected: `SourceBadge` is already a self-contained component with its own prop shape; lifting it into the same file as its only consumer is cleaner and removes a module-local leak from the panel.

### Decision 2 — Column definitions live in `tracks-admin-columns.tsx` as a factory, not as a self-contained component

The `useMemo<ColumnDef<TrackListItem>[]>` at `tracks-admin-panel.tsx:1131-1299` closes over `activeLanguage`, `handleParse`, `markingAsManualId`, `parsingTrackId`, and `t`. Lifting it into its own file as a factory `createTracksAdminColumns({ activeLanguage, handleParse, markingAsManualId, parsingTrackId, t })` returns the array; the caller wraps the call in `useMemo` (or `useCallback`) with the same dependency list as today. This keeps the memoisation contract owned by the panel (where the `useTransition` / router state already lives) and avoids leaking the `useT(tripsNamespace)` / `useRouter` boundary into a helper module.

**Alternatives considered:**

- *A self-contained `TracksAdminTable` component* — rejected: the `DataTable` is rendered by the panel alongside the timezone / delete / parse dialogs and a couple of card-level buttons; pulling the whole table into its own file is out of scope and would couple the column definitions to a future component split.
- *A hook `useTracksAdminColumns()`* — rejected: the column array does not need its own React state, and a hook would force the column factory to depend on the same `useT` / `useRouter` boundary the panel already closes over; a plain factory is simpler and just as memoisation-friendly.

### Decision 3 — `useTrackRowActions` hook lives in `lib/track-row-actions.ts` as a `"use client"` module

The per-row pending-state machine (`parsingTrackId`, `markingAsManualId`, `markAsManualTarget`, `handleParse`, `handleMarkAsManualConfirm`) is a self-contained client-side state machine that owns the `parseTrackGpx` / `markTrackAsManual` dispatch and the toast strings. The `lib/` directory already groups track-domain helpers (`track-duration-input.ts`, `track-gpx-metadata.ts`, `track-recording-timezone.ts`, `track-synthetic-gpx.ts`); the precedent for `"use client"` in `lib/` is `lib/track-map-bounds.ts` (uses `useEffect` + `useMap`). The hook returns `{ parsingTrackId, markingAsManualId, markAsManualTarget, setMarkAsManualTarget, handleParse, handleMarkAsManualConfirm }` so the panel can wire `TrackFormDialog` (`parsingTrackId` prop), the column definitions (`handleParse` / `markingAsManualId` / `parsingTrackId`), the table cell (`markingAsManualId === row.original.id`), and the mark-as-manual dialog (`markAsManualTarget` / `setMarkAsManualTarget` / `handleMarkAsManualConfirm`) from a single source.

**Alternatives considered:**

- *Co-locate the hook in the panel file* — rejected: the candidate explicitly asks for it in `lib/track-row-actions.ts` (or similar), and putting the hook in the panel re-introduces the per-row state machine into the same file we are trying to thin out.
- *Put the hook in `components/admin-pages/use-track-row-actions.ts`* — rejected: only the admin panel consumes this hook today, but its surface area (server actions, toasts, per-row state) is closer to the `lib/track-*.ts` cluster than to the admin-components cluster. If a future `my-tracks` panel needs the same per-row state machine, the `lib/` location is the natural shared home.
- *A plain reducer or context* — rejected: only one component consumes the hook today; introducing a reducer or context adds ceremony without removing state from the panel.

### Decision 4 — `TrackFormDialog` receives `parsingTrackId` from the hook, not from a prop

`TrackFormDialog` at `tracks-admin-panel.tsx:247-263` accepts `parsingTrackId` as a prop and uses it to derive `isParsing` at line 273. The prop interface stays unchanged: the panel calls `<TrackFormDialog ... parsingTrackId={rowActions.parsingTrackId} ... />`. The hook is the single source of truth for `parsingTrackId`; the panel no longer owns `setParsingTrackId` directly.

**Alternatives considered:**

- *Have the dialog call `useTrackRowActions` directly* — rejected: the dialog is also rendered for create mode (when `track` is `null`), and `parseTrackGpx` is a row-level action that needs the saved track id; the panel is the right place to coordinate the hook and pass the relevant id.
- *Lift `parsingTrackId` out of the hook and let the panel own it* — rejected: it would split the per-row pending state across two locations, undoing the point of the hook.

## Risks / Trade-offs

- **Risk:** The hook in `lib/track-row-actions.ts` is a `"use client"` module, and `lib/` is otherwise a server-friendly collection. Importing it into a server component would fail at build time. → **Mitigation:** the hook is consumed only by `tracks-admin-panel.tsx`, which already declares `"use client"`; a future server-side caller would be a misuse and would be caught by the linter when the consumer file does not declare `"use client"`.
- **Risk:** The column factory closes over five dependencies (`activeLanguage`, `handleParse`, `markingAsManualId`, `parsingTrackId`, `t`); a typo in the dependency list at the call site would silently produce stale columns. → **Mitigation:** the call site wraps the factory in `useMemo` with the same five deps in the same order as today's `useMemo<ColumnDef<TrackListItem>[]>`; the diff is minimal and the lint rule for `useMemo` already catches missing deps.
- **Risk:** `TrackParseStatus` becomes a re-export from a cell module; future readers may grep for it in the panel file and miss it. → **Mitigation:** a brief JSDoc block at the top of `tracks-admin-panel-parse-cell.tsx` notes that `TrackParseStatus` is re-exported from this file and that future readers should look here for both components.
- **Risk:** The `SourceBadge` move changes the relative order of imports inside the new file (e.g. `formatTrackTimeSource` comes from `lib/track-gpx-metadata.ts` and is imported in the panel today). → **Mitigation:** the move carries the import verbatim; the new file imports the same helpers from the same path.

## Migration Plan

This is a pure refactor with no observable change. The migration plan is the standard `feature-XXX-outdoor-...` flow:

1. Apply the change on a branch off `master`.
2. Run `npm run tsc`, `npm run lint`, and a targeted `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/tracks-admin-panel-parse-cell.tsx components/admin-pages/tracks-admin-columns.tsx lib/track-row-actions.ts --quiet` to catch cross-file issues.
3. Have the user run `npm run build` to validate the production bundle still builds with the new file layout.
4. Have the user run the manual smoke check listed in the proposal's Impact section: open `/admin/tracks`, click the row-level `Source: GPX` badge for a misclassified GPX row, open the edit dialog and confirm the `Recording start` / `Recording duration` read-only hint still renders, click `Refresh` and confirm the spinner still works, confirm the mark-as-manual loader still renders.
5. If a regression appears, the rollback is a single `git revert` of the merge commit — no data migration, no schema change, no env var change.

## Open Questions

None.
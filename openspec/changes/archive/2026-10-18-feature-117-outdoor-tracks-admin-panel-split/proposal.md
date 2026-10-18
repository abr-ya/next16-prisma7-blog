# Proposal

## Why

`components/admin-pages/tracks-admin-panel.tsx` grew to 1446 lines during the feature-112 → feature-113 → feature-116 slice chain (recording-metadata columns, source badge, in-dialog `Mark as manual`, `Source: GPX` row-level clickable badge). The single file now owns every track-admin concern at once: a 600-line `TrackFormDialog`, a row-level `SourceBadge` / `TrackParseStatus` cell rendered inline in the table column, a per-row pending-state machine (`parsingTrackId`, `markingAsManualId`, `setMarkAsManualTarget`, `isMarkingAsManual`), and the `ColumnDef<TrackListItem>[]` for the admin table. The table column definitions and the parse cell render `SourceBadge` / `TrackParseStatus` / cell-level click handlers inline at the panel level, which makes the panel a third owner of cell rendering alongside the dialog and `TrackParseStatus`. Per-row pending state is hand-rolled across the panel and the dialog with no shared helper. This change is the first slice of a planned refactor series: extract the parse cell, the column definitions, and the per-row pending-state helper into dedicated files so the panel becomes a thin orchestrator. Pure refactor, no observable behaviour change.

## What Changes

- **Extract the parse cell into its own component**: move the inline parse column cell (currently the `parse` column at `tracks-admin-panel.tsx:1182-1207`, composed of `SourceBadge` + `TrackParseStatus` + the `hasNoTimedTimeline` derivation) into `components/admin-pages/tracks-admin-panel-parse-cell.tsx`. `SourceBadge` moves with it (already module-local at `tracks-admin-panel.tsx:166-193`); `TrackParseStatus` stays where it is shared with the form dialog context — re-exported if needed. The cell owns the `hasNoTimedTimeline` derivation so the table column no longer carries it.
- **Extract the column definitions into their own module**: move the `useMemo<ColumnDef<TrackListItem>[]>` (currently `tracks-admin-panel.tsx:1131-1299`) into `components/admin-pages/tracks-admin-columns.tsx` as a factory that returns memoised columns given the dependencies the panel currently closes over (`activeLanguage`, `handleParse`, `markingAsManualId`, `parsingTrackId`, `t`). The `DataTable` is rendered in `tracks-admin-panel.tsx` with the columns imported from the new module.
- **Extract the per-row pending-state helper**: lift `parsingTrackId` / `markingAsManualId` / `markAsManualTarget` / `handleParse` / `handleMarkAsManualConfirm` (currently `tracks-admin-panel.tsx:1064-1129`) into a single hook `useTrackRowActions` in `lib/track-row-actions.ts` (the `lib/` directory already groups track-domain helpers like `track-duration-input.ts`, `track-gpx-metadata.ts`, and `track-recording-timezone.ts`). The hook owns the four pieces of state, dispatches `parseTrackGpx` and `markTrackAsManual`, toasts success/error, refreshes the router, and exposes `{ parsingTrackId, markingAsManualId, markAsManualTarget, setMarkAsManualTarget, handleParse, handleMarkAsManualConfirm }`. `TrackFormDialog` continues to receive `parsingTrackId` from the panel (or directly from the hook) so the existing per-dialog `isParsing` derivation stays byte-identical.

### Non-goals

- Not splitting `TrackFormDialog`. The 600-line create/edit dialog remains a single component in this slice; its concerns (map editor, GPX upload, recording-metadata inputs, timezone reset, in-dialog mark-as-manual, discard-changes guard, submit-and-parse wiring) are explicitly deferred to follow-up slices.
- Not changing the public track map, public track list, public track detail, admin track list, or hike linked-track card render path. No i18n key changes, no Prisma migration, no server-action signature change, no behaviour change.
- Not extracting the `useT(tripsNamespace)` `activeLanguage` derivation, not extracting the timezone / delete / parse dialogs, and not touching the `setTimezoneTarget` / `setDeleteTarget` per-row state (they live on the panel-level dialogs, not the row actions).
- Not lifting `TrackParseStatus` into a shared `lib/` module. The component already imports all its formatters from `lib/track-gpx-metadata.ts`; re-exporting it from `tracks-admin-panel-parse-cell.tsx` is the only structural change for it.
- Not bundling `outdoor-tracks-admin-panel-parallel-audit` or any cross-panel split. This slice is scoped strictly to `tracks-admin-panel.tsx` and the three files it produces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

This change is a pure refactor (file split) with no observable behaviour change. Per OpenSpec workflow, `skip_specs: true` is set in `.openspec.yaml`.

## Impact

- **Schemas**: no Prisma migration; the `Track`, `FileAsset`, and related models are unchanged.
- **Code**
  - **New**: `components/admin-pages/tracks-admin-panel-parse-cell.tsx` — owns the parse-column cell, the `SourceBadge` component (moved from `tracks-admin-panel.tsx`), and the `hasNoTimedTimeline` derivation. Exports `TracksAdminPanelParseCell` and `SourceBadge`.
  - **New**: `components/admin-pages/tracks-admin-columns.tsx` — exports `createTracksAdminColumns({ activeLanguage, handleParse, markingAsManualId, parsingTrackId, t })` returning `ColumnDef<TrackListItem>[]`. The factory is `useMemo`-friendly (callers wrap it in `useMemo` or `useCallback`).
  - **New**: `lib/track-row-actions.ts` — exports `useTrackRowActions({ onSuccess?: () => void })` returning `{ parsingTrackId, markingAsManualId, markAsManualTarget, setMarkAsManualTarget, handleParse, handleMarkAsManualConfirm }`. Imports `parseTrackGpx` and `markTrackAsManual` from existing server actions; toasts use the same messages as the panel (`GPX parsed` / `GPX parsing failed` / `Failed to parse GPX` / `trackMarkAsManualSuccess` / `Failed to mark track as manual`).
  - **Modified**: `components/admin-pages/tracks-admin-panel.tsx` — drop `SourceBadge` (moved), the inline parse cell render (replaced with `<TracksAdminPanelParseCell ... />`), the column definitions (replaced with `const columns = useMemo(() => createTracksAdminColumns({...}), [...])`), and the per-row pending state + handlers (replaced with `const rowActions = useTrackRowActions({ onSuccess: () => router.refresh() })`). The `DataTable` call site, `TrackFormDialog` call site (still receives `parsingTrackId` from `rowActions`), `handleTimezoneSave`, `handleDelete`, the timezone / delete / parse dialogs, and the panel shell stay byte-identical apart from the source line shifts.
- **Localization**: no i18n key changes; all existing `trips.json` keys (`trackMarkAsManualBadgeAriaLabel`, `trackMarkAsManualSuccess`, etc.) are reused.
- **Spec**: none (pure refactor; `skip_specs: true`).
- **Validation**: `npm run tsc`, targeted eslint on the three touched files, and `npm run lint` for the `app/` directory tree. Manual smoke: open `/admin/tracks` with at least one GPX row and one MANUAL row, click the row-level `Source: GPX` badge (when the row has no timed timeline) to open the mark-as-manual dialog, click `Edit` and confirm the `Recording start` / `Recording duration` read-only hint still renders for GPX rows, confirm the `Refresh` button still spins and the mark-as-manual loader still renders for the row being acted on, and confirm no console warnings about unrecognised props on `DataTable` cells.
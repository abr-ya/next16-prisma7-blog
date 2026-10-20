# Output — research-001 tracks admin panel parallel audit

**Date:** 2026-10-20
**Scope:** 7 files, 5581 lines (post feature-117).
**Verdict:** feature-by-feature grouping wins. 5 lift findings, 4 skip (2 of which false-premise), 3 needs more research. Three `refactor-XXX` slices are recommended first; the existing `*-admin-panel-split` candidates stay in the queue and proceed against smaller files after the extractions land.

## Findings

### Q1 — Panel shell pattern (tracks / hikes / photos admin panels)

| Finding | Occurrences | Verdict |
| --- | --- | --- |
| Sortable-title header (byte-identical 3-line button + `ArrowUpDown`) | `tracks-admin-columns.tsx:61`, `hikes-admin-panel.tsx:1081`, `photos-admin-panel.tsx:730` | **lift** → trivial `SortableHeader` helper |
| Panel root + "Add {entity}" toolbar + `formOpen` / `editing{Entity}` state pair | `tracks-admin-panel.tsx:1047-1053`, `hikes-admin-panel.tsx:1234-1240`, `photos-admin-panel.tsx:858-864` | **lift (small)** → optional same-PR cleanup or follow-up `refactor-004-panel-toolbar-extras` |
| Delete-row lifecycle (state trio + handler + `ConfirmDialog` block, ~35 near-verbatim lines per site) | `tracks-admin-panel.tsx:941-1127`, `hikes-admin-panel.tsx:1073-1313`, `photos-admin-panel.tsx:679-889` | **lift (strong)** → `useDeleteRowConfirm<T>({ action, deletedMsg, notFoundMsg })` |
| `<DataTable>` invocation | 3 sites (one-liner each) | skip — already encapsulated in `components/common/data-table.tsx:18-43` |
| Filter state plumbing (search / status / visibility / pagination / sort state) | none | skip — false premise; no shared filter state exists (search/filter greps only hit array `.filter()` inside dialogs) |
| Bulk-action wiring (`Set<string>` selection, "select all", batched `Promise.all`) | none | skip — false premise; no row-selection or batched mutation exists in any of the 7 files |
| Column-def factory | `tracks-admin-columns.tsx:48` (extracted, 6+ callback params); `hikes-admin-panel.tsx:1076` and `photos-admin-panel.tsx:708` (inline `useMemo`) | needs more research — shape depends on the approved `*-admin-panel-split` slices |

### Q2 — Confirm-dialog duplication (12 invocations across 6 files; `hike-photo-gallery.tsx` has zero)

Shared primitive: `components/common/confirm-dialog.tsx:15-26` — props `open, onOpenChange, title, description?, confirmLabel?, cancelLabel?, confirmVariant?, isPending?, onConfirm, onCancel?` (defaults "Confirm"/"Cancel"/"default"/false). The four `open={Boolean(xxxPhoto)}` Dialogs in `hike-photo-gallery.tsx` are content viewers, not confirms, and were excluded.

| Finding | Sites | Verdict |
| --- | --- | --- |
| Delete-row confirm wiring (props verbatim across the three panels, only entity nouns in two strings vary) | `tracks-admin-panel.tsx:1116-1127`, `hikes-admin-panel.tsx:1300-1313`, `photos-admin-panel.tsx:878-889` | **lift** → covered by the `useDeleteRowConfirm` hook from Q1; the helper owns `open` / `onOpenChange` / `isPending` / target-clear |
| Discard-unsaved lifecycle (`uploadedFileAssetIds` + `discardConfirmOpen` + `isDiscarding` + `hasGuardedChanges` + guarded `handleOpenChange` + `handleConfirmDiscard` calling `markDiscardedTrackGpxFileAssetsPendingDelete`, ~50 lines incl. word-for-word dialog strings) | `tracks-admin-panel.tsx:174-265, 902-935` (TrackFormDialog), `hike-track-contribution-form.tsx:105-156, 397-410` | **lift** → `useDiscardGuardedTrackForm` hook |
| Note-delete in `HikeNotesEditor` (id-keyed, nested in a sub-component) | `hikes-admin-panel.tsx:874-1043` | needs more research — id-vs-entity target shape needs inspection of `files-table` / `videos-table` ConfirmDialog callers outside these 7 files |
| content-tags-inventory 4 sites | `:527` (merge), `:542` (delete), `:562` (remove), `:593` (replace) | skip — single-occurrence scaffold already factored locally (`runAction` wrapper at `:113-130`) |
| video-form 1 site | `:474-486` | skip — only user of `onCancel`; nothing to share yet |

### Q3 — TrackRecordingFields

| Finding | Verdict |
| --- | --- |
| Full 4-field recording block (`recordingStartAt`, `recordingDurationSeconds`, `recordingTimezone`, `includeSeconds`, `md:grid-cols-3`↔`md:grid-cols-2` swap, H/M/S numeric inputs, submit-side parsing for GPX and manual paths) | **needs more research** — appears only in `tracks-admin-panel.tsx:209-700`. `hike-track-contribution-form.tsx:55-64, 62, 75, 188, 361-373` carries `recordingTimezone` only. See open question below. |
| `TrackEditor` (place-on-map editor) | skip — already shared at `components/track-pages/track-editor.tsx`; single consumer (`tracks-admin-panel.tsx:881-886`); `hike-track-contribution-form.tsx` has no place-on-map tab |
| `TrackGpxUploadSection` upload half | skip — already lifted in feature-110; both panels consume it as `onUploadComplete({fileAssetId, fileName})` / `onUploadError` callbacks |
| Timezone input + datalist (in-file tracks duplication; same `getSupportedTrackRecordingTimezones()` option source memoized twice) | **lift (track sites only)** → `TimezoneInput`. Photo-timezone variant (4 hardcoded options UTC / Europe/Sofia / Europe/Moscow / America/New_York) sees the same markup but different semantics — **needs more research**, resolve in `refactor-003`. |

## Recommended next 2-3 `refactor-XXX` slices (feature-by-feature)

1. **`refactor-001-delete-row-confirm`** — `useDeleteRowConfirm<T>` hook plus the `ConfirmDialog` wiring for the three admin panels. Highest-confidence lift, shrinks each panel by ~35 lines and prepares for the queued `hikes-admin-panel-split` and `photos-admin-panel-split` candidates.
2. **`refactor-002-discard-guarded-track-form`** — `useDiscardGuardedTrackForm` hook covers `TrackFormDialog` and `hike-track-contribution-form.tsx` together (~50 lines of lifecycle each). Default to the feature-116 refactor shape (dumb section + callbacks).
3. **`refactor-003-timezone-input`** — in-file tracks duplication first; the photo-timezone 4-option variant is a separate decision inside the same slice.

After these three land, `hikes-admin-panel-split` / `photos-admin-panel-split` / `hike-photo-gallery-extract` candidates proceed against smaller files. The `SortableHeader` + panel-root + "Add entity" findings from Q1 are also genuine lifts; fold them into `refactor-001` as a same-PR cleanup or split into a fourth `refactor-004-panel-toolbar-extras` — pick when the first three are done.

## Open questions (out of scope for this research)

- **Recording inputs in the trip-page contribution form.** Today only `recordingTimezone` is captured on `/trips/[slug]`; the other three live only in the admin dialog. Whether the trip-page path should accept all four inputs (a future `feature-XXX` candidate) or stay timezone-only by design is a policy question. Recommend not extracting `TrackRecordingFields` until that decision lands, because the apparent cross-file duplication isn't actually a duplication today.
- **Note-delete hook shape.** Aligning `HikeNotesEditor` with `useDeleteRowConfirm<T>` requires inspecting non-scope `ConfirmDialog` callers (`files-table`, `videos-table`). Defer.
- **Photo-timezone variant option list.** Same `TimezoneInput` markup, different options (`getSupportedTrackRecordingTimezones()` vs the photo-domain `{UTC, Europe/Sofia, Europe/Moscow, America/New_York}`). Resolve in `refactor-003` once the photo domain decides whether to consume the supported track timezone list.

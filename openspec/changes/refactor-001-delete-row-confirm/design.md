# Design

## Where the hook lives

`lib/use-delete-row-confirm.ts`, next to `lib/track-row-actions.ts`.

That is the closest precedent in the repo: `useTrackRowActions` is already a panel row-action hook living in `lib/`, and `tracks-admin-panel.tsx:53` already imports it from there. The root `hooks/` directory was rejected — of its four barrel exports only `useIsMobile` is a real React hook, the other three are zustand stores that merely use the `use*` naming.

## The hook

```ts
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type DeleteRowConfirmOptions<T> = {
  /** Server action that takes a row id and reports whether it succeeded. */
  deleteAction: (id: string) => Promise<{ success: boolean }>;
  /** Dialog title, e.g. `"Delete track?"`. */
  title: string;
  /**
   * Builds the dialog description from the row. A builder rather than a
   * template because the three panels word their descriptions differently,
   * not just by entity noun.
   */
  getDescription: (row: T) => string;
  deletedMsg: string;
  notFoundMsg: string;
};

type DeleteRowConfirm<T extends { id: string }> = {
  target: T | null;
  setTarget: (row: T | null) => void;
  confirmDialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string | undefined;
    confirmLabel: string;
    confirmVariant: "destructive";
    isPending: boolean;
    onConfirm: () => void;
  };
};

export function useDeleteRowConfirm<T extends { id: string }>(
  options: DeleteRowConfirmOptions<T>,
): DeleteRowConfirm<T>;
```

**Why the hook does not render `<ConfirmDialog>` itself.** It returns a spreadable props object instead. That keeps JSX in the panel, keeps `ConfirmDialog` a presentation concern, and matches research-001's verdict that the helper owns `open` / `onOpenChange` / `isPending` / target-clear.

**Why `T extends { id: string }`.** All three panels pass `row.id` to their action, so the constraint is real rather than decorative. It also makes a wrong wiring a compile error instead of a runtime `undefined` id.

**Why the hook calls its own `useRouter()`.** Each panel already holds a `router` of its own for unrelated actions. Multiple `useRouter()` calls in one tree are fine, and not threading `router` through the options keeps the call sites short.

## Hardcoded rather than parameterized

These are byte-identical at all three sites and are implied by the hook's meaning, so they are not options:

| Value | Value used | Why not an option |
| --- | --- | --- |
| `confirmLabel` | `"Delete"` | identical everywhere; anything else would be a misnomer for a delete hook |
| `confirmVariant` | `"destructive"` | identical everywhere |
| cancel path | none | **no** delete dialog passes `onCancel` — see below |
| post-delete | `router.refresh()` | identical everywhere |

Exposing them would add six call-site lines to save one that nothing uses.

## Behavior that must be preserved exactly

**1. `setTarget(null)` and `router.refresh()` run unconditionally — on success *and* on not-found.** The current handler puts them outside the `if (result.success)` branch. Moving them inside the success branch would be a behavior change: today a failed delete still closes the dialog and refetches the table. Do not "tidy" this.

**2. The hikes panel's lexical mismatch is intentional, not a bug to fix.** Its toasts say `"Trip deleted"` / `"Trip not found"` while its dialog title says `"Delete hike?"`. The entity noun is `Trip` in toasts and `hike` in the dialog. Carry both strings over verbatim.

**3. No `try`/`catch`.** None of the three delete handlers has one — unlike `handleTimezoneSave` and `handleRefresh` in the same file. Adding error handling would change behavior and belong to a `fix-` or `feature-` change, not this refactor.

**4. The three description strings differ in wording, not just entity noun:**

```
tracks: This will remove "<title>" from the admin tracks list.
hikes:  This will remove "<title>" from admin and public hike lists.
photos: This will remove "<title>" from the admin photos list.
```

Hence `getDescription: (row) => string` rather than a shared template with a slot.

## What `ConfirmDialog` already does — do not duplicate

From `components/common/confirm-dialog.tsx`:

- `handleConfirm` already does `if (isPending) return` before awaiting `onConfirm`, so double-submit is blocked at the dialog level.
- `onOpenChange` is already suppressed mid-flight: `<Dialog onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>`.
- `onCancel` is optional and fires before `onOpenChange(false)`.

The hook therefore adds no pending guard of its own. Duplicating it would be dead code.

## Per-panel wiring

```ts
// tracks-admin-panel.tsx
const deleteConfirm = useDeleteRowConfirm<TrackListItem>({
  deleteAction: deleteTrack,
  title: "Delete track?",
  getDescription: (row) => `This will remove "${row.title}" from the admin tracks list.`,
  deletedMsg: "Track deleted",
  notFoundMsg: "Track not found",
});
```

```ts
// hikes-admin-panel.tsx
const deleteConfirm = useDeleteRowConfirm<HikeListItem>({
  deleteAction: deleteHike,
  title: "Delete hike?",
  getDescription: (row) => `This will remove "${row.title}" from admin and public hike lists.`,
  deletedMsg: "Trip deleted",
  notFoundMsg: "Trip not found",
});
```

```ts
// photos-admin-panel.tsx
const deleteConfirm = useDeleteRowConfirm<PhotoListItem>({
  deleteAction: deletePhoto,
  title: "Delete photo?",
  getDescription: (row) => `This will remove "${row.title}" from the admin photos list.`,
  deletedMsg: "Photo deleted",
  notFoundMsg: "Photo not found",
});
```

The dialog then collapses to a spread:

```tsx
<ConfirmDialog {...deleteConfirm.confirmDialogProps} />
```

and the tracks panel's existing `onSetDeleteTarget: setDeleteTarget` prop becomes `onSetDeleteTarget: deleteConfirm.setTarget`.

### Type risk at the tracks boundary

`useState`'s setter is `Dispatch<SetStateAction<T | null>>`, which also accepts an updater function. The hook exposes the narrower `(row: T | null) => void`. If `createTracksAdminColumns` types `onSetDeleteTarget` as the full `Dispatch`, passing the narrower function is a compile error. Check the declared prop type in `components/admin-pages/tracks-admin-columns.tsx` before assuming the drop-in works; if it requires `Dispatch`, widen `setTarget`'s type or narrow the prop type — whichever the surrounding file already prefers.

## State removed from the panels

- `const [deleteTarget, setDeleteTarget] = useState<XListItem | null>(null)` — removed from all three.
- `const [isDeleting, startDeleting] = useTransition()` — remove **only** if `isDeleting` is used nowhere else in the component. The tracks panel has a second, independent transition (`isSavingTimezone, startSavingTimezone`) that must be left alone. Verify per panel rather than assuming.

## Explicitly out of scope

Confirmed present in the same files but belonging elsewhere:

- `tracks-admin-panel.tsx:1128-1143` — the `markAsManual` `ConfirmDialog`, an unrelated lifecycle with `confirmVariant="default"` and an i18n'd title.
- The `Set recording timezone` dialog in the tracks panel.
- `tracks-admin-panel.tsx:902-923` — the discard-changes `ConfirmDialog` inside `TrackFormDialog`. That lifecycle is `discard-guarded-track-form`, a separate candidate.
- `hikes-admin-panel.tsx:874-1043` — `HikeNotesEditor`'s note-delete confirm. research-001 graded it **needs more research**: aligning it requires inspecting `ConfirmDialog` callers outside the audit scope (`files-table`, `videos-table`) to settle id-keyed vs entity-keyed targets.
- `content-tags-inventory.tsx` (4 sites) and `video-form.tsx` (1 site) — both graded **skip** by research-001.
- The `SortableHeader` extraction. research-001 verified byte-identity at three panel sites and suggested it as same-PR cleanup, but a follow-up sweep found the same pattern in **seven more** `components/admin-pages/` tables (`videos-table`, `links-table`, `categories-table`, `posts-table`, `files-table`, `video-channels-table`, `md-docs-table`). Those seven were never checked for byte-identity, so the total is ten possible sites rather than three confirmed ones. Extracting a helper at three of ten sites would leave the codebase asymmetric — a helper in three files, inline JSX in seven — which is worse than a uniform duplicate. It becomes the separate `sortable-header` candidate.

## Risks

| Risk | Mitigation |
| --- | --- |
| Accidentally "fixing" the unconditional `router.refresh()` | Called out in Behavior item 1; it is the one change that would silently alter behavior |
| Adding `try`/`catch` while touching the handler | Called out in Behavior item 3 |
| Dropping `isDeleting` where it is still used | Per-panel verification task, not an assumption |
| Tracks columns prop type mismatch | Explicit type risk section above |
| The hook becoming a generic `useConfirmAction` | Out of scope by design — research-001 declined that shape; two of its three motivating premises were false (no shared filter state, no bulk-action wiring exist in any of the seven audited files) |
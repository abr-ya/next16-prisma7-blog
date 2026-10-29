# Proposal

## Why

**The shared track discard guard is the last English-only surface on dialogs whose whole interface is localized.** `lib/use-discard-guarded-track-form.ts` hardcodes ten English strings — three dialog titles, three descriptions, two confirm labels, the success toast, and an error fallback. All three of its consumers render inside a translated interface:

- the admin track create/edit modal (`/admin/tracks`),
- the trip-side `Add track` dialog on `/trips/[slug]`,
- the quick workout upload dialog on `/my/workouts`.

A Russian-speaking trip creator who uploads a GPX file, changes the title, and closes the dialog gets an English question — *"Discard track and uploaded GPX?"* — asking them to confirm that their file will be deleted. That question is the one moment where the wording has to be read carefully before it can be answered safely; the rest of the same dialog is in Russian.

The error toast is stranger than a stale literal, because it is not even the hook's own string. The hook writes `toast.error(result.message || "Uploaded GPX file could not be removed")`, but the server action always returns a `message`, so the fallback is unreachable and the user actually reads the action's English `message`. The copy in the hook and the copy the user sees are two different sets of strings, and both of them are English.

Everything needed to fix this is already in place: the `trips` namespace ships to the client in both `en` and `ru`, the admin track panel and the quick upload dialog already read from it, and the hook is already a `"use client"` module.

## What Changes

- **The guard's copy moves into the `trips` namespace** as a nested `discardGuard.*` block, with an `en` and a `ru` entry for every string. The English text is the current text, unchanged; the Russian text is a translation of it.
- **The hook reads that copy** through `useT(tripsNamespace)` — the same `next-i18next` client hook `lib/track-row-actions.ts` already uses from `lib/`.
- **All three consumers get the translated copy at once**, because they share the hook. No consumer passes a string; none of them could before either.
- **The discard failure toast becomes localizable.** `markDiscardedTrackGpxFileAssetsPendingDelete` gains a machine-readable `code` on its failure result (`NOT_SAFE` / `NOT_OWNER`) alongside the existing English `message`, and the hook maps the code to a localized string. The English text of the failure toast is byte-for-byte what the user reads today; the Russian one is now Russian.

The behavior does not change. What counts as a guarded change, when the confirmation appears, what a confirmed discard clears, which discard confirms a file removal and which one stays silent, and the order of the toast and the close are all exactly as they are.

### Non-goals

- **No new wording and no reworded wording.** The English strings are moved, not rewritten. The Russian strings are translations of the English ones.
- **The `Cancel` button stays English.** The guard's dialog uses `ConfirmDialog`'s default cancel label, which seventeen other call sites share. Localizing it is a separate sweep over `components/common/confirm-dialog.tsx`. The guard's own strings — title, description, confirm label, toasts — are the scope here.
- **The admin track panel's other hardcoded English stays.** `Track created`, `Track updated`, `Choose a supported IANA timezone`, `Recording timezone saved`, `Earlier uploaded GPX file could not be removed`, `Failed to save track` — a wider sweep, out of scope.
- **The admin panel's separate "earlier uploaded GPX" cleanup path stays English.** It is a different code path (`cleanupSupersededUploads` in `components/admin-pages/tracks-admin-panel.tsx`), it keeps reading the action's `message`, and the `code` field this change adds does not disturb it.
- **No change to the shared `ConfirmDialog` component** and no change to the shape of the hook's `confirmDialogProps`.
- **Not the `fix-007` stale-upload-ids quirk** (the admin dialog's "mark as manual" close path). Separate candidate.
- **Not the single-brace interpolation bugs** in four existing `trips` keys. Separate candidate; the new keys use no placeholders and are unaffected either way.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks` — the shared track discard guard renders its copy in the interface language on the admin track modal and the trip-side `Add track` dialog.
- `outdoor-quick-workout-upload` — the quick upload dialog's discard confirmation and its outcome toasts render in the interface language.

## Impact

- **Schemas**: no Prisma migration, no database impact.
- **Routes**: none. The three surfaces are an admin-only component under `/admin`, the public trip-page dialog, and the owner's workouts page.
- **Public surfaces**: the trip-side `Add track` dialog and the quick upload dialog stop showing English on a Russian interface. No new markup, no new route, no new data.
- **Code**: 1 hook file modified, 1 server action file modified, 2 locale files modified, 0 changes at the three call sites.
- **Server actions**: `markDiscardedTrackGpxFileAssetsPendingDelete` gains a `code` on its failure result and an explicit return type. Its `message` field, its success results, and its database behavior are unchanged.
- **Depends on**: nothing. The hook, the `trips` namespace, and both locales are already in place.

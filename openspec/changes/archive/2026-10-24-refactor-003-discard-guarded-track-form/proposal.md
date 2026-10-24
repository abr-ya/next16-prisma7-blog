# Proposal

## Why

**No user-visible outcome — this is a pure internal refactor.** Two track forms carry a near-verbatim copy of the same "discard unsaved changes" lifecycle: a three-`useState` trio, a guarded `handleOpenChange`, a `handleConfirmDiscard` that calls `markDiscardedTrackGpxFileAssetsPendingDelete`, and a `<ConfirmDialog>` block wired with word-for-word identical copy. Two forms duplicate it today.

The duplication sits in the two places a track is created or edited:

- `components/admin-pages/tracks-admin-panel.tsx:174-265, 902-935` — the admin `TrackFormDialog`.
- `components/hike-pages/hike-track-contribution-form.tsx:105-156, 397-410` — the public trip-page `HikeTrackContributionDialog`.

research-001 (`openspec/changes/archive/2026-10-20-research-001-tracks-admin-panel-parallel-audit/output.md`) graded this lifecycle **lift** in its Q2 table and named `useDiscardGuardedTrackForm` as the target hook, with the feature-116 refactor shape (dumb section + callbacks). It is the second of the three slices research-001 recommended, and the one `refactor-001-delete-row-confirm` explicitly left behind.

Extract it now because the remaining candidates in `openspec/refactor-backlog.md` — `hikes-admin-panel-split`, `photos-admin-panel-split` — are panel splits that will otherwise re-edit these same regions.

## What Changes

- **Extract `useDiscardGuardedTrackForm`** into `lib/use-discard-guarded-track-form.ts`, owning the whole discard-unsaved lifecycle: the uploaded-file-asset id list, the confirm-dialog open flag, the discard transition, the guarded `handleOpenChange`, the `handleConfirmDiscard` that calls `markDiscardedTrackGpxFileAssetsPendingDelete`, and the discardable-id derivation.
- **Wire both forms** to the hook: the admin `TrackFormDialog` and the public `HikeTrackContributionDialog`.

Net effect: roughly 40 lines removed from each of the two forms.

The two sites are *near*-duplicates, not identical. Recon during design found six code-level differences, and a review of each showed that **five of them are the same rule with an empty parameter** on one side — not competing behaviors:

1. The admin form excludes the saved `fileAssetId` from the discard set; the public form has no saved row to protect, so nothing is excluded. One rule, empty parameter on one side.
2. The admin dialog has a third copy branch (`"Discard placed points?"`); the public dialog cannot stage points, so that rung of the ladder is unreachable there. One ladder.
3. The error-toast fallback (`result.message || "Uploaded GPX file could not be removed"`) existed only on the admin side. The action returns a non-empty message on every failure path, so the fallback was **dead code** that diverged by copy-paste; the extraction keeps one spelling for both. No observable change.
4. The admin form shows the success toast `"Uploaded GPX file discarded"`; the public form shows no success toast at all. **This is the one genuine, observable divergence** — the public form deletes the user's uploaded GPX without acknowledging it.
5. `hasGuardedChanges` is computed differently, but each form's term is correct for its own structure: the admin's place-on-map path submits the form values (`createManualTrack(trackPayload, placedPoints)`), so form-dirty counts on that tab; the public attach path submits no form values (`attachCreatorTrackToHike({ hikeId, trackId })`), so form-dirty does not count on the attach tab. One rule with a per-form dirty term.
6. The admin form's close path also clears staged map points; the public one has no points to clear. One rule, empty parameter on one side.

So the extraction carries **one** real divergence (the success toast) plus five parameters that are empty on one side. The success toast cannot be unified here — that is a user-visible change, so it becomes the separate change `fix-008-public-track-discard-success-toast`.

### Non-goals

- **No behavior change of any kind.** Same dialog copy, same messages, same confirmation semantics, same server action, same reset timing. This is what keeps the change in the `refactor-XXX` pool under the hybrid rule. The one exception is the dead error-toast fallback, which is unified because it is unreachable — the action always returns a non-empty message.
- **Not adding a success toast to the public form.** The admin form has one and the public form does not; adding it would be a user-visible change and belongs to `fix-008-public-track-discard-success-toast`, not here.
- **Not adding the `"Discard placed points?"` branch to the public form.** The public form has no map-point staging at all, so the branch is unreachable there.
- **Not changing the reset timing of either form.** The public form clears its uploaded ids on open; the admin form does not. The hook does not reset on open — see `design.md`.
- **Not lifting the shared track timezone input** — that is the `timezone-input` candidate.
- **Not performing the panel splits** (`hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`). Separate candidates.
- **Not touching `useDeleteRowConfirm`**, which already covers the row-delete lifecycle in the three admin panels.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

Pure internal refactor with no observable behavior change, so there are no spec deltas. `skip_specs: true`.

## Impact

- **Schemas**: no Prisma migration, no database impact.
- **Routes**: none. One call site is an admin-only component under `/admin`; the other is the public trip-page dialog.
- **Public surfaces**: none. The hook is internal to `lib/`.
- **Code**: 2 form components modified, 1 new hook file.
- **Server actions**: `markDiscardedTrackGpxFileAssetsPendingDelete` is unchanged and still called by the same code path with the same id set. The hook imports it directly instead of each form importing it.
- **Behavior**: unchanged — the hybrid rule is what keeps this in the refactor pool.

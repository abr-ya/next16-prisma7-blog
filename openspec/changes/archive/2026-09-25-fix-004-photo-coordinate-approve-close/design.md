# Design

## Context

The hike photo gallery in [components/hike-pages/hike-photo-gallery.tsx](../../components/hike-pages/hike-photo-gallery.tsx) opens a "GPX coordinates" dialog when an owner or admin clicks the coordinate review action on a linked photo. The dialog content is `HikePhotoCoordinateReview` from [components/hike-pages/hike-photo-coordinate-review.tsx](../../components/hike-pages/hike-photo-coordinate-review.tsx), which exposes four server-action-driven flows:

1. Automatic `Approve` on a candidate (`acceptHikePhotoTrackTimeMatchCandidate` with no manual lat/lng).
2. Manual `Save manual correction` (same server action plus a manual lat/lng pair).
3. `Confirm timezone` (`confirmHikePhotoCaptureTimezone`).
4. `Reject map coordinate` (`rejectHikePhotoMapCoordinate`).

All four flows call `onChanged()` on success, which in the gallery today only runs `startTransition(() => router.refresh())`. As a result:

- Flows (1) and (2) complete the reviewer's intent — the photo now has an accepted coordinate — but the dialog stays open and the reviewer has to close it manually.
- Flows (3) and (4) are supporting actions: confirm timezone is meant to feed into a subsequent approve, and reject is meant to be followed by a manual correction. The current behavior of "stay open on success" is correct.
- On error, each flow's `try/catch` toasts and skips `onChanged`, so the dialog stays open with the previous state. This behavior is correct and must be preserved.

See [proposal.md](proposal.md) for motivation.

## Goals / Non-Goals

**Goals:**

- Distinguish "approve completed" from "supporting action completed" in the child's success callback so the parent can decide whether to close the dialog.
- Close the dialog on successful automatic Approve and on successful manual correction.
- Keep the dialog open on Confirm timezone and on Reject map coordinate.
- Keep the dialog open and show the error toast when any of the four server actions throws.
- Minimal diff: a typed reason parameter on one prop, plus a small branch in the gallery handler.

**Non-Goals:**

- No server action changes (`acceptHikePhotoTrackTimeMatchCandidate`, `confirmHikePhotoCaptureTimezone`, `rejectHikePhotoMapCoordinate` stay untouched).
- No schema, no data model, no migration, no dependency changes.
- No change to Reject's UX beyond "stay open" (it already stays open — that is the desired behavior).
- No change to Confirm timezone's UX beyond "stay open".
- No new dialog state primitives, no new toast messages, no new design tokens.

## Decisions

### Decision 1: Typed reason union on `onChanged`

Replace the existing `onChanged: () => void` prop with `onChanged: (reason: "approved" | "refresh") => void`. The four flows signal:

| Flow | Reason |
| --- | --- |
| Automatic `Approve` | `"approved"` |
| Manual `Save manual correction` | `"approved"` |
| `Confirm timezone` | `"refresh"` |
| `Reject map coordinate` | `"refresh"` |

The error path in each `try/catch` keeps the existing behavior of toasting and skipping the callback, so the dialog stays open on failure regardless of the reason semantics.

- **Why a union rather than two callbacks:** the child already has a single `onChanged` prop and the gallery already wraps its handler with `startTransition`; a typed reason keeps the call shape consistent and lets the parent switch on it. A two-callback API would duplicate the wrapping.
- **Why `"approved" | "refresh"` rather than free-form strings:** the two outcomes are mutually exclusive and exhaustive for this dialog; a string union keeps the type narrow and refactor-friendly.
- **Alternatives considered:** adding `onApproved?: () => void` alongside `onChanged: () => void` (works but expands the prop surface for one extra behavior); closing the dialog from the child via a forwarded ref or shared state (more code, leaks dialog ownership into the child).

### Decision 2: Parent owns the close decision

`HikePhotoGallery` already owns `coordinatePhotoId` and `setCoordinatePhotoId`. It branches on the reason:

```ts
onChanged={(reason) => {
  startTransition(() => {
    router.refresh();
    if (reason === "approved") setCoordinatePhotoId(null);
  });
}}
```

- **Why the parent:** the dialog's open/closed state is already parent-owned; the child stays unaware of how the dialog is implemented.
- **Why inside the existing `startTransition`:** the current gallery handler already wraps `router.refresh()` in a transition to avoid blocking UI. Adding `setCoordinatePhotoId(null)` to the same transition is the same non-blocking pattern.

## Risks / Trade-offs

- **A manual correction without any candidate** → the `Save manual correction` button is already `disabled` when `detail.candidates.length === 0` (see [components/hike-pages/hike-photo-coordinate-review.tsx](../../components/hike-pages/hike-photo-coordinate-review.tsx) line `disabled={disabled || isPending || detail.candidates.length === 0}`), so this path cannot fire today. No new risk.
- **A reviewer who confirms timezone and then immediately rejects** → both flows signal `"refresh"` and the dialog stays open. Reviewer can still close manually. No new risk.
- **Closing the dialog mid-`isPending`** → the child's `isPending` is local to `HikePhotoCoordinateReview`; once the parent resets `coordinatePhotoId`, React unmounts the dialog and the child's pending server action result is discarded. The server actions are idempotent (they set the accepted coordinate / timezone / clear it), so even if the request landed on the server before unmount, the next `router.refresh()` renders the new state. No data corruption.
- **No automated browser test** → mitigation: a small manual smoke check on a trip with a linked photo (covered in tasks §3.4).

## Migration Plan

None. No Prisma schema change, no env change, no auth change, no data migration. Deployment is two in-place edits and a small prop type tightening in the child. Rollback is a single `git revert`.

## Open Questions

None.
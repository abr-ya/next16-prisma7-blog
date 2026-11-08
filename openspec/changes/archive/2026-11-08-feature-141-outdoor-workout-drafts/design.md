# Design

## Context

See `proposal.md` for motivation and `specs/outdoor-tracks/spec.md` for the required behavior.

Today `Track` is both the workout and its geometry. `Track_geometry_source_check` requires exactly one of `fileAssetId` or `routeId`, and `Track.fileAssetId` is unique. The owner's workout list reads through `getOwnerWorkoutTracks`, the period filter anchors on `getEffectiveTrackStart`, and the week summary counts every visible workout while summing only the distances it can resolve. The public queries already filter on `status = "PUBLISHED"`.

## Goals / Non-Goals

**Goals:**

- Let a workout exist before its geometry does, without weakening the ready-state invariant.
- Keep the owner's private note out of every public and administrative projection.
- Reuse the existing quick-workout wording, slug, gear, and duration helpers instead of inventing a second set.

**Non-Goals:**

- Secondary files, multiple tracks, and demoting a file when a route is attached (`feature-142`).
- Drafts for activity types other than walking.
- Changing the quick upload, the public track page, or the admin track table.
- Automatic draft expiry.

## Decisions

### 1. Add `geometryState` instead of making the geometry nullable everywhere

Add `enum TrackGeometryState { PENDING READY }` and `Track.geometryState` with default `READY`. Existing rows migrate to `READY` automatically. A draft is created explicitly as `PENDING`.

Replace `Track_geometry_source_check` with:

```text
PENDING: routeId IS NULL AND fileAssetId IS NULL AND metadata IS NULL
READY:   (routeId IS NULL AND fileAssetId IS NOT NULL)
         OR (routeId IS NOT NULL AND fileAssetId IS NULL AND metadata IS NULL)
```

Add a publish guard:

```text
status <> 'PUBLISHED' OR geometryState = 'READY'
```

Alternative considered: make `fileAssetId`/`routeId` nullable without a state column. Rejected because "no geometry yet" and "geometry was lost" would become indistinguishable, and the publish guard would have no explicit signal.

### 2. `privateNote` is a separate owner-only column

Add `Track.privateNote String?`. It is never part of the public list projection or the default `trackListSelect` used by the administrative page. The owner queries opt in through an explicit `includePrivateNote` projection; `TrackListItem` carries it as an optional field so an administrative row cannot accidentally render it. The public detail query selects the note and returns it only when the viewer is the track owner, so the owner sees it on their own published page while every other viewer receives no note. The detail page is already `force-dynamic`, so the owner-only block is never served from a stale cache.

Alternative considered: reuse `description`. Rejected because `description` is public and the example note is personal.

### 3. Draft creation is a small, dedicated action and dialog

Add `createDraftWorkout(input)` to `app/_data/tracks.ts`. It:

- applies `requireTrustGatedAction("track-upload")` and `createWithinVerifiedResourceQuota(user, "track", ...)`, so a draft uses the same trust and quota rules as any other track;
- resolves the active `walking` activity type;
- validates optional gear against the owner and against walking;
- accepts an ISO recording-start instant and the device timezone; an unsupported timezone is stored as `null`;
- converts fractional minutes to whole seconds with `Math.round(minutes * 60)` and rejects non-positive durations;
- stores `status = "DRAFT"`, `kind = "TRAINING"`, `geometryState = "PENDING"`, `timeSource = null`, and the private note;
- accepts the client-suggested title and slug base, then makes the slug unique on the server.

The client reuses `getQuickWorkoutDaypart`, the `quickWorkout.activities.walking` wording, and `buildQuickWorkoutSlugBase`, so the draft title and slug match the quick upload's conventions.

Alternative considered: reuse the full track form for creation. Rejected because the form is built around a geometry source and would make the quick capture heavy.

### 4. Completion is explicit, and route always wins

- **GPX file**: reuse the existing upload and parse path. Attaching the file sets `geometryState = "READY"`; the parse sets `timeSource = "GPX"` when the file carries usable timestamps, and the parsed start and duration replace the provisional values. A file without usable `<time>` values keeps the draft's start, duration, and timezone and is marked `MANUAL`, while still supplying geometry and distance.
- **Existing or new route**: a new `attachRouteToTrack(trackId, routeId)` action validates ownership and `PENDING`, then updates `routeId`, clears the file fields, sets `geometryState = "READY"` and `timeSource = "MANUAL"` in one transaction. The entered start, duration, and timezone stay.

This slice deliberately does not demote a file to secondary geometry; that belongs to `feature-142`.

Alternative considered: always let the file win, even when it carries no usable timestamps. Rejected because it would erase the only recording record the owner has — exactly the case the draft exists for.

### 5. Draft editing stays small; the full track form remains the post-completion editor

A dedicated draft dialog collects the start, duration, note, and gear, and shows the completion actions. After completion, the existing track form owns the title, description, status, timezone, and publication. This keeps the quick capture quick and avoids teaching the full form a second geometry-optional mode.

Alternative considered: extend `TrackFormDialog` with a draft mode. Rejected because the form's validation, upload section, and route picker all assume a geometry source; a dedicated small dialog is less risky.

### 6. Public reads require `READY`; admin reads may show drafts

Public listing and detail queries add `geometryState: "READY"` to their `where` clauses, so a pending row is never reachable even if its status is changed outside the application. The administrative table keeps listing the owner's rows, including drafts, but never selects `privateNote`.

## Risks / Trade-offs

- [Drafts consume the track quota] → Accepted: a draft is a track row and counting it prevents quota evasion. If this proves annoying, excluding `PENDING` from the quota is a separate decision.
- [A GPX completion overwrites the entered time] → Only when the file carries usable timestamps; a file without them keeps the draft's values and marks the track `MANUAL`.
- [The private note is selected by the public detail query] → It is returned only when the viewer is the owner; the public list never selects it, and the detail page is `force-dynamic`.
- [Read paths that assume geometry exists] → `resolveTrackGeometry` already returns `null`; `withResolvedGeometry` already returns the row unchanged. Update the comments/types and verify the list, admin table, and edit surfaces against a `PENDING` row.
- [A manually published pending row could reach the public page] → The publish guard rejects it in the database, and the public queries also filter on `READY`.
- [The migration's default `READY` hides a missed backfill] → The default is intentional: every existing row already satisfies the ready-state check, and only the draft action writes `PENDING`.

## Migration Plan

1. Create the `TrackGeometryState` enum.
2. Add `geometryState` with default `READY` and `privateNote` nullable.
3. Drop and recreate `Track_geometry_source_check` with the pending branch.
4. Add the publish guard.
5. Deploy the code that writes and reads the new fields.

Rollback: delete or complete any `PENDING` rows first, then drop the publish guard, restore the previous geometry check, and drop the two columns. No existing row needs a data migration beyond the default.

## Open Questions

None that change the scope. The private-note length follows the existing description limit (2000 characters).

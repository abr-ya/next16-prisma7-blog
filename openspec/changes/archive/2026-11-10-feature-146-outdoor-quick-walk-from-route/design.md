# Design

## Context

See `proposal.md` for motivation and `specs/outdoor-quick-route-workout/spec.md` for the required behavior.

The quick walk dialog (`QuickWorkoutUploadDialog`) already owns the activity type, the owner's gear, the preferred gear, the title/slug suggestion helpers, and the discard guard. The owner's routes are already loaded by `TrackManagementPanel` and passed to the full track form. `RouteListItem` carries `hasMetadata`, so filtering to parsed routes is a client-side filter. `createTrackFromRoute` already creates a `READY` track whose primary geometry is a route, but it defaults to `DRAFT`/`ROUTE` and refuses a slug conflict.

## Goals / Non-Goals

**Goals:**

- One dialog, two modes, with no stacked modal.
- Reuse the quick upload's title, slug, gear, and trust/quota conventions.
- Publish the route workout immediately and keep the route as the primary geometry.

**Non-Goals:**

- Creating or editing a route in this dialog.
- Drafts, a status selector, or activity types other than walking.
- Schema, migration, or public-payload changes.

## Decisions

### 1. Switch the dialog content in place

Add a `mode` state (`gpx` | `route`) to the quick dialog. The footer shows a secondary **Create with route** action next to Save in GPX mode; clicking it switches the content to the route form. The route form's footer shows **Back to GPX upload** and Save. The GPX form's state stays in the dialog, so returning does not lose the typed title or selected gear.

Alternative considered: close the quick dialog and open a separate route modal. Rejected because it causes a visible jump, loses the dialog context, and still needs the same uploaded-file guard.

### 2. Disable the route action while a GPX is present

The action is disabled when `fileAssetId` is set and while the upload is in progress. The dialog tracks an `isUploading` flag from `onBeforeUpload` / `onUploadComplete` / `onUploadError`. A short hint explains that the uploaded file must be removed first. This avoids a destructive discard prompt for a mode switch.

Alternative considered: ask the discard guard on switch. Rejected for the first slice because it turns a navigation action into a destructive confirmation.

### 3. The route form offers only parsed routes

Filter `routes` with `hasMetadata`. If none remain, show an empty state and keep Save disabled. The owner cannot create a route here.

### 4. Add a dedicated quick route action

Add `createQuickRouteWorkout(input)` in `app/_data/tracks.ts`:

- applies `requireTrustGatedAction("track-upload")` and `createWithinVerifiedResourceQuota(user, "track", ...)`;
- validates the owned route, the walking activity type, the gear compatibility, the wall-clock start plus timezone, and the duration seconds;
- generates a unique slug through the same `ensureUniqueTrackSlug` helper the GPX quick upload uses;
- creates `status = "PUBLISHED"`, `kind = "TRAINING"`, `timeSource = "MANUAL"`, the route as primary geometry, and no own file;
- returns the same `{ ok, code, message }` vocabulary as the other track actions.

Alternative considered: reuse `createTrackFromRoute` with `status: "PUBLISHED"` and `kind: "TRAINING"`. Rejected because it refuses a slug conflict and would make the quick path fail when two walks start in the same minute.

### 5. Reuse the quick upload's title, slug, and gear rules

The route form computes the title from `getQuickWorkoutDaypart` and the `quickWorkout.activities.walking` wording, and the slug base from `buildQuickWorkoutSlugBase`, exactly as the GPX mode does. It sends the `datetime-local` wall clock and the device timezone; `createTrackFromRoute`'s server-side parser needs the wall clock, not an ISO instant. The gear list and preferred preselection reuse the existing `fittingGear` logic.

### 6. Keep the dialog's copy in the existing `trips` namespace

Add the route-mode labels under `quickWorkout.routeMode.*` (button, title, route label/placeholder, start, duration, gear, back, empty state, success/error). English and Russian are both required.

## Risks / Trade-offs

- [The GPX form and route form share one dialog] → Keep both states in the dialog and render one form at a time; the GPX state survives a round trip.
- [A route is parsed but its file is private] → The public track page uses the route geometry but offers no GPX download; that is the existing route behavior.
- [The owner expects route creation here] → The empty state links to `/my/routes` and says a route must be created or parsed there first.
- [The route form's start is a wall clock] → Send the `datetime-local` value plus the device timezone; do not send an ISO instant to the existing parser.

## Migration Plan

None. Revert the dialog and action to remove the mode.

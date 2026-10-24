# Proposal

## Why

**A weekday run and a weekend trip are the same shape of data, but they are not the same thing to their owner.** The `Track` model records what a track *is* (its activity type — walking, running, cycling) and where it came from (a GPX upload, or points placed on a map). It has no way to record what the track is *for*. A 5 km morning run around the park and a 60 km ride to the lake are both tracks; only the first one is a routine training session. An owner who logs a workout every morning has no way to say so, and no way to ask their own data the simplest question there is: "show me my workouts."

The request behind this change has three parts — a routine-training flag, a page that shows only trainings, and, later, a rule that trainings never become part of a trip (a trip is a journey; a Tuesday evening run is not). The third part is a product rule that needs its own slice, and it only becomes possible once the flag exists. The first two are the foundation, and they land together: a flag nobody can filter by is a label, not a feature.

## What Changes

- **Every track carries a kind.** A new Prisma enum `TrackKind { ROUTE, TRAINING }` and a `Track.kind` column, defaulting to `ROUTE`. Every track that exists today is a route until its owner says otherwise.
- **The owner marks a track as a workout from the track form.** The shared track dialog — the same one behind `/my/tracks` and `/admin/tracks` — gains a "Track kind" select with `Route` and `Workout`. Both creation paths (GPX upload and Place on map) honor it, and an existing track's kind can be changed by editing it.
- **A new `/my/workouts` page lists only workouts.** Authenticated, owner-scoped, and built on the same track management panel as `/my/tracks` — but filtered to `kind = TRAINING`. A track created from that page defaults to the workout kind.
- **The list shows the kind.** The track table gains a "Kind" column with a `Route` / `Workout` badge, so the owner can tell the two apart without opening a row.

### Non-goals

- **Not restricting trip attachment.** A workout can still be attached to a trip in this slice. "Workouts are not part of trips" is a separate feature that lands on top of this flag — it needs its own rule, its own copy, and its own handling of tracks that were attached before they were marked as workouts.
- **Not a public classification.** The kind is a private owner-side label. It does not appear on public track pages, public track lists, or trip cards, and nothing about a user's workouts becomes public.
- **Not the gear inventory and not the Strava link.** Both are separate features with their own numbers; they build on this model, they are not part of it.
- **Not a new activity type.** `Walking` and `Running` already exist as activity types. The kind answers a different question — what the track is for, not which activity it was. A run and a race are both `Running`; only one of them is a training.
- **Not a replacement for `/my/tracks`.** `/my/tracks` keeps listing everything the owner has. `/my/workouts` is an additional, narrower view.
- **Not changing the trip-side `Add track` dialog.** A track created inside a trip is a route by construction; the trip-side dialog gets no kind control.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks` — tracks carry an owner-set kind, the owner can mark a track as a workout from the shared track form, and a new `/my/workouts` page lists only the owner's workouts.

## Impact

- **Schemas**: one new Prisma enum `TrackKind`, one new `Track.kind` column (`NOT NULL`, `DEFAULT 'ROUTE'`), one new composite index on `(userId, kind)`. The migration is additive — existing rows backfill to `ROUTE` and no data is rewritten.
- **Routes**: one new page, `/my/workouts`.
- **Public surfaces**: none. The kind is owner-only; no public page, list, card, or feed changes.
- **Code**: `prisma/schema.prisma` plus one new migration, `app/_data/tracks.ts`, `components/admin-pages/tracks-admin-panel.tsx`, `components/admin-pages/tracks-admin-columns.tsx`, `components/blog-pages/navbar-user-menu.tsx`, and one new page file under `app/(public)/my/workouts/`.
- **Server actions**: `createTrack`, `updateTrack`, and `createManualTrack` accept an optional kind and validate it. The trip-side attach path (`createTrackAndAttachToHike`) is untouched and keeps creating routes.
- **Follow-ups this change enables**: the gear inventory (one gear item per track) and the Strava activity link both hang off the same "a track is one of my training sessions" model, and the "workouts are not part of trips" rule becomes expressible once the kind exists.

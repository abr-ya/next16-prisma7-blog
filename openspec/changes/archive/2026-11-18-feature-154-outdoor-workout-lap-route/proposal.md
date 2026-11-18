# Proposal

## Why

A composite lap route exists and can be built in `/my/routes`, but the moment an owner actually knows how many laps they ran is the moment they create the workout. Today that means leaving the workout form, building the variant in the route library, and coming back. And once the workout exists, nothing on it says the route is a lap variant — not on the public page, not in the owner's workouts table.

This slice closes both gaps: laps are entered while creating the workout, the variant is created or reused underneath, and the resulting workout shows its lap count.

## What Changes

- Add a **Laps** field to every route-based workout creation flow: **Add track → From route** on `/my/tracks` and `/admin/tracks`, the quick walk/run route mode on `/my/workouts`, and the route step that completes a draft workout.
- `1` keeps today's behaviour — the chosen route is used as is. A value above `1` produces a lap variant: one `MAIN` segment, that child route, that lap count.
- A shared server resolver finds an identical variant already owned by the caller (same child route, same lap count, single segment) and reuses it; otherwise it creates one through the shipped composition core.
- Default variant title is `<route title> × <laps>`, trimmed to the shared route title limit; the workout keeps its own title and slug.
- The server refuses laps on an open route with the existing `OPEN_LAP` message, and a lap count below one with a validation message.
- Show the lap count where the workout is read: a badge on the public `/tracks/[slug]` header, a badge on the `/tracks` list card, and a sortable **Laps** column in the owner's workouts table. Laps are counted from the route's `MAIN` segments only, so a lead-in and a lead-out never add a lap; a multi-segment route also reports its segment count (`3 laps · 3 segments`).
- No schema change and no migration: the recipe, its lap counts, and the generated geometry already exist.

## Non-goals

- Per-workout lap counts on a route without a materialized variant.
- Changing the lap count of an existing workout from its detail page; the builder is the way to edit a variant.
- Authoring `START`/`END` segments and non-contiguous geometry. The lap display already accepts a lead-in and a lead-out, but building them belongs to `outdoor-route-start-end-segments`.
- Ingredient (`isPart`) routes; the parts slice owns them.
- Lap display on the administrative track table, on trip cards, or inside the route picker beyond the field itself.
- Localizing the new copy; the route and workout surfaces it joins are English-only today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-route-composition`: a workout creation can build or reuse a lap variant inline, with reuse, naming, and refusal rules.
- `outdoor-tracks`: a workout whose route is a single lap variant reports its lap count on the public page, the public list, and the owner's workouts table.

## Impact

- `lib/route-composition.server.ts` — a find-or-create lap variant resolver on top of the existing core.
- `app/_data/tracks.ts` — `lapCount` on the three route-based creation actions, the refusal of a bad lap count, and the route composition projection the read paths need.
- `components/admin-pages/tracks-admin-panel.tsx`, `components/track-pages/quick-workout-upload-dialog.tsx`, `components/track-pages/draft-workout-dialog.tsx` — the inline **Laps** field.
- `components/admin-pages/tracks-workout-columns.tsx` — the **Laps** column.
- `app/(public)/tracks/page.tsx`, `app/(public)/tracks/[slug]/page.tsx` — the lap badge.
- No schema, migration, API, or dependency changes.

# Proposal

## Why

The quick walk dialog already turns an existing route into a published walking workout, and the running quick-add button already turns a GPX file into a published run. A run against a route the owner already has still needs the full track form, so the fastest everyday case for a runner is missing.

## What Changes

- Offer the quick dialog's route mode for the running activity type as well as walking. The existing predicate that the dialog and the server share becomes the single list of route-capable activity types.
- Let `createQuickRouteWorkout` accept running: the created workout keeps the dialog's activity type instead of being refused unless it is walking.
- Keep the existing route-mode behaviour for both types: one parsed route, recording start, fractional duration, fitting gear with the preferred pair preselected, generated title and slug, published `TRAINING` workout, no file of its own.
- Give the route-mode copy an activity-specific title and gear hint (`Run an existing route` / `Пробежка по готовому маршруту`, `No shoes for running` / `Нет обуви для пробежек`) with the current walking wording as the fallback.
- Leave the GPX quick upload, the walking route mode, and every other activity type unchanged.

## Non-goals

- Route creation or editing from the dialog, including composite or multi-lap routes.
- Activity types other than walking and running.
- Draft workouts, a status or kind control in the route mode.
- Schema, migration, public-payload, or route-library changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-quick-route-workout`: the route mode is no longer walking-only; it serves every route-capable quick workout activity type (walking and running), and its wording names the activity type it creates.

## Impact

- `lib/quick-workout.ts` — the shared route-capable activity-type predicate.
- `app/_data/tracks.ts` — `createQuickRouteWorkout` accepts running and keeps the dialog's activity type.
- `components/track-pages/quick-workout-upload-dialog.tsx` — gate the route action on the predicate and read activity-specific copy.
- `app/i18n/locales/en/trips.json`, `app/i18n/locales/ru/trips.json` — running route-mode title and gear hint.
- No database, API, or dependency changes.

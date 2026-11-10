# Proposal

## Why

The quick walk dialog currently only turns a GPX file into a workout. When the owner already has a route and just wants to record a walk against it, the only path is the full track form. A second, small mode in the same dialog makes that case as quick as the file upload.

## What Changes

- Add a secondary **Create with route** action to the quick walk dialog footer, next to Save. It is disabled while a GPX file is uploaded, because the two sources are alternatives.
- Switch the dialog content in place to a route form instead of opening a second modal. The route form offers:
  - an existing parsed route;
  - the recording start date-time;
  - the duration in minutes, fractional minutes allowed;
  - the walking shoes, with the preferred pair preselected.
- Add a **Back to GPX upload** action so the owner can return to the file mode.
- Generate the title and slug the same way the quick upload does, publish the created workout immediately, and make it a `TRAINING` track whose primary geometry is the route.
- Show only routes that already have parsed metadata; if none exist, show an empty state and keep Save disabled.
- No route creation in this dialog.

## Non-goals

- Creating or editing a route from this dialog.
- Draft workouts or a status selector; the quick route workout publishes immediately.
- Activity types other than walking.
- A schema, migration, or public-payload change.
- Reusing this mode for the draft dialog or the full track form.

## Capabilities

### New Capabilities

- `outdoor-quick-route-workout`: the quick walk dialog's route mode — mode switch, parsed-route picker, start/duration/gear, auto title/slug, and the published training workout it creates.

### Modified Capabilities

None.

## Impact

- `components/track-pages/quick-workout-upload-dialog.tsx` — footer action, mode state, and route form.
- `components/admin-pages/tracks-admin-panel.tsx` — pass the owner's routes to the quick dialog.
- `app/_data/tracks.ts` — a quick route-workout action with a unique slug and the published/training defaults.
- `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json` — new copy.
- No database, API, or dependency changes.

# Proposal

## Why

The owner's workouts page already offers a one-click "Add a walk" path that turns a GPX file into a published workout with a suggested title, a unique slug, the recording timezone, and the preferred gear for that activity type. Running has the same need, but its activity type has no wording entry, so the generic quick-add mechanism renders no button for it.

## What Changes

- Add a `running` entry to `quickWorkout.activities` in the English and Russian dictionaries: the button label, the noun used in suggested titles, the gear-reminder label, and the four daypart adjectives.
- Make the running button visually distinct from the walking button: walking becomes an outline button with a footprints icon, running is a primary button with an activity icon. The generic panel renders both from the same per-activity-type button map.
- The existing generic behavior then provides the rest: the button appears for the active `running` activity type, the dialog binds to it, the suggested title becomes `Morning run` / `Утренняя пробежка`, the slug base becomes `running-YYYY-MM-DD-HHmm`, and the owner's preferred gear for running is preselected.
- Add spec scenarios that pin the running quick-add button and its visual distinction to the existing per-activity-type requirement.

## Non-goals

- No new activity types beyond the already seeded `running`.
- No new "favorite shoes" model: the existing per-activity-type gear preference (feature-124) is reused.
- No change to the quick upload dialog, server action, slug builder, title suggester, or gear selection logic.
- No visual change to the other header actions, such as `Add track`, and no change to the walking dialog.
- No quick-add buttons for cycling, skiing, rowing, or other activity types in this slice.
- No changes to public track pages, admin tables, or the workouts table.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-quick-workout-upload`: the per-activity-type quick-add requirement gains a concrete running scenario; the underlying behavior is unchanged.

## Impact

- `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json` — new `quickWorkout.activities.running` entries.
- `components/admin-pages/tracks-admin-panel.tsx` — per-activity-type icon and button-variant map for the quick-add buttons.
- `openspec/specs/outdoor-quick-workout-upload/spec.md` — one modified requirement.
- No database, API, dependency, or component changes.

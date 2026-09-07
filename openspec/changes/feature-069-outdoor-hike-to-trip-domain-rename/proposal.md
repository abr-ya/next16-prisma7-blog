## Why

The outdoor domain now includes city walks, water routes, cycling, skiing, and hikes. `Trip` is a clear umbrella term for visitors and avoids implying that every record is a walking hike.

## What Changes

- Adopt `Trip` as the user-facing and application-domain term for the current hike-centered content.
- Move primary public and admin routes to `/trips` and `/admin/trips`, preserving `/hikes` and `/admin/hikes` as redirects.
- Rename domain models, actions, components, and associations to `Trip` while preserving existing data and public slugs.
- Keep `Photo` independent rather than introducing `TripPhoto`.

**Non-goals:** changing trip records, changing existing visibility rules, adding new trip types/categories, or deleting legacy URLs/data.

## Capabilities

### New Capabilities

- `outdoor-trips`: A broad trip domain covering city walks and existing outdoor trip types.

### Modified Capabilities

- `outdoor-hikes`: Preserve compatibility for legacy hike URLs and references during the Trip transition.

## Impact

- Affected: Prisma schema/migrations, `app/_data`, admin/public routes, navigation, maps, photos, tracks, notes, metadata, and OpenSpec terminology.
- No new dependency is expected; migration must preserve all existing records and URLs.

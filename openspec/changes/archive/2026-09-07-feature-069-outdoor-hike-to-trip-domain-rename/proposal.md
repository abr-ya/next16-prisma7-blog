## Why

The outdoor domain now includes city walks, water routes, cycling, skiing, and hikes. `Trip` is a clear umbrella term for visitors and avoids implying that every record is a walking hike.

## What Changes

- Adopt `Trip` as the user-facing term for the current hike-centered content.
- Move primary public and admin routes to `/trips` and `/admin/trips`, preserving `/hikes` and `/admin/hikes` as redirects.
- Keep the current Prisma schema and internal `Hike` API stable for this slice.

**Non-goals:** changing trip records, changing existing visibility rules, adding new trip types/categories, or deleting legacy URLs/data.

## Capabilities

### New Capabilities

- `outdoor-trips`: A broad trip domain covering city walks and existing outdoor trip types.

### Modified Capabilities

- `outdoor-hikes`: Preserve compatibility for legacy hike URLs and references during the Trip transition.

## Impact

- Affected: admin/public routes, navigation, links, metadata, revalidation, copy, and OpenSpec terminology.
- No schema migration or dependency is expected; existing records and legacy URLs remain intact.

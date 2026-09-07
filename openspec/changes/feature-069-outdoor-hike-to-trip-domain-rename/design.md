## Context

The Hike domain owns tracks, photos, and notes and is used by public/admin routes, server actions, maps, and Prisma relations. City walks are now a full use case, so `Trip` is more accurate.

## Goals / Non-Goals

**Goals:** adopt `Trip` without changing records, IDs, slugs, visibility, or relations; establish canonical trip routes with legacy redirects; map existing database storage during the transition.

**Non-Goals:** new categories, permissions, schema redesign, or deleting legacy URL support.

## Decisions

### Use Trip, not OutdoorTrip

`Trip` includes city walks and existing hiking, cycling, water, ski, and other types. `OutdoorTrip` would exclude a supported city-walk use case.

### Rename application names while mapping existing storage

Use Prisma mapping for current physical tables, columns, and relation names in the first transition. This avoids destructive table recreation or a bulk data move.

### Make trip URLs canonical with redirects

Move implementations to `/trips` and `/admin/trips`; legacy hike URLs permanently redirect. Internal links, metadata canonicals, navigation, and revalidation use trip URLs.

## Risks / Trade-offs

- Missed references → inventory Hike, hike, `/hikes`, and relation names before edits.
- Redirect regressions → test listing/detail routes and canonical metadata.
- Prisma relation rename can generate unsafe SQL → review and reject drop/create or data-loss migrations.

## Migration Plan

1. Add mapped Prisma Trip names and regenerate the client without changing stored data.
2. Move code/routes and add permanent redirects.
3. Validate associations, access, public visibility, maps, and legacy URLs.
4. Consider physical table renames only in a later dedicated migration.


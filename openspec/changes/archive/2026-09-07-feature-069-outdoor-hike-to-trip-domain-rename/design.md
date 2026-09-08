## Context

The Hike domain owns tracks, photos, and notes and is used by public/admin routes, server actions, maps, and Prisma relations. City walks are now a full use case, so `Trip` is more accurate.

## Goals / Non-Goals

**Goals:** adopt `Trip` in public/admin language without changing records, IDs, slugs, visibility, relations, or the internal Prisma domain; establish canonical trip routes with legacy redirects.

**Non-Goals:** new categories, permissions, schema redesign, or deleting legacy URL support.

## Decisions

### Use Trip, not OutdoorTrip

`Trip` includes city walks and existing hiking, cycling, water, ski, and other types. `OutdoorTrip` would exclude a supported city-walk use case.

### Keep the internal Hike API stable in this slice

The first slice changes routes, internal links, metadata, and visible labels only. Current Prisma models, tables, data helpers, and relation names stay `Hike`-based; a later independently deployable feature will rename the code domain using storage mappings.

### Make trip URLs canonical with redirects

Move implementations to `/trips` and `/admin/trips`; legacy hike URLs permanently redirect. Internal links, metadata canonicals, navigation, and revalidation use trip URLs.

## Risks / Trade-offs

- Missed references → inventory Hike, hike, `/hikes`, and relation names before edits.
- Redirect regressions → test listing/detail routes and canonical metadata.
- Future Prisma relation rename can generate unsafe SQL → defer it to a dedicated feature with migration review.

## Migration Plan

1. Move route implementations and add permanent redirects without a schema migration.
2. Update links, metadata, navigation, revalidation, and visible labels to canonical trip URLs.
3. Validate redirects, access, public visibility, maps, and associations.
4. Defer internal Prisma/API and physical storage renames to later dedicated migrations.

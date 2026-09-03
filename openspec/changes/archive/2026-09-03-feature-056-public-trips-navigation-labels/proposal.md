## Why

Visitors should be able to discover the existing hike/trip outdoor pages from the home page and shared top navigation now, even before the full `Hike` to `Trip` domain rename is implemented.

## What Changes

- Add a Trips entry to the public home page content hub.
- Add a Trips entry to the shared public top navigation.
- Label the entry as "Trips" in English and the matching Russian navigation label while it continues to point to the existing `/hikes` route.
- Explicitly document the temporary naming mismatch: public labels may say Trips while underlying routes, models, actions, and specs still use hike terminology until the dedicated rename feature is accepted and implemented.

## Non-goals

- Do not rename Prisma models, database tables, route folders, server actions, data helpers, or admin hike management code in this slice.
- Do not add `/trips` routes or redirects in this slice.
- Do not add or change trip categories, trip types, or admin category management in this slice.
- Do not change existing hike/trip data, track associations, photo associations, or public visibility rules.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `public-home-page`: Add Trips as a primary public content section on the home page.
- `public-navigation`: Add Trips as a shared public navbar item that temporarily points to `/hikes`.

## Impact

- Affected public routes: `/` and shared public top-nav surfaces.
- Temporary target route: `/hikes`.
- Affected UI code: home content section list, public navbar item list, and navigation locale resources.
- Affected data models: none.
- Affected admin surfaces: none.

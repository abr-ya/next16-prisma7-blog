## Context

See `proposal.md` for motivation. The current codebase already has independent `Hike` and `Track` models, owner-scoped admin helpers in `app/_data/hikes.ts` and `app/_data/tracks.ts`, public `/hikes/[slug]` and `/tracks/[slug]` pages, and parsed GPX metadata stored on `Track.metadata`.

## Goals / Non-Goals

**Goals:**

- Add a durable association between hikes and tracks without changing existing hike or track identity.
- Let admins manage associations from admin surfaces while preserving server-side authorization.
- Expose associated published tracks on published hike pages and associated published hikes on published track pages.
- Keep public data helpers visibility-safe and avoid exposing UploadThing provider URLs.
- Preserve existing GPX parsing, track download, and public track map behavior.

**Non-Goals:**

- No hike-photo association, participant management, or public upload workflow.
- No combined multi-track map on the hike page.
- No automatic hike-track matching by dates, geometry, filenames, or metadata.
- No change to existing single-track map rendering behavior.

## Decisions

### Use a join table for hike-track associations

Add a Prisma join model such as `HikesToTracks` with `hikeId`, `trackId`, `assignedAt`, and a composite primary key on `[hikeId, trackId]`. This keeps both records reusable and prevents duplicate associations naturally.

Alternative considered: add nullable `hikeId` to `Track`. That is simpler, but it would make shared tracks and future overlapping trip reports harder.

### Keep association management admin-only in this slice

Association create/delete actions should require admin authorization server-side. The public owner/participant upload path is planned later, so this slice should not introduce broader contributor permissions.

Alternative considered: let hike owners attach their own tracks now. That overlaps with the future participant/public contribution model and would create a second permission rule to unwind.

### Reuse existing public detail pages instead of adding a combined map

Public hike pages should list linked published tracks with links to `/tracks/[slug]`. The existing track detail page remains the place that renders one track map and enforces GPX download visibility.

Alternative considered: render all linked track geometry on the hike page immediately. That belongs to the later combined map slice and needs separate layout/performance validation.

### Extend public read models with filtered associations

`getPublicHikeBySlug` should include only associated tracks with `PUBLISHED` status for public rendering. `getPublicTrackBySlug` should include only associated hikes with `PUBLISHED` status. Admin read models can include draft associations because admins need review visibility.

Alternative considered: fetch associations separately in pages. Keeping visibility filtering in data helpers is more consistent with existing public helper boundaries.

### Revalidate both sides of changed associations

Attach/detach actions should revalidate `/admin/hikes`, `/admin/tracks`, the affected public hike detail path, and the affected public track detail path when slugs are available.

Alternative considered: revalidate only the current admin page. That risks stale public cross-links after association changes.

## Risks / Trade-offs

- Migration adds a new relational table -> Mitigation: make it additive and preserve all existing `Hike`, `Track`, `FileAsset`, and metadata rows.
- Admin UI can become crowded if association controls are embedded into existing table rows -> Mitigation: prefer compact dialogs or dedicated row actions following existing admin panel patterns.
- Existing hike and track helpers are owner-scoped in places -> Mitigation: use admin-only association helpers for cross-record management and avoid broadening non-admin access.
- Public pages may accidentally expose draft linked records -> Mitigation: keep public association filtering in server data helpers and render only the sanitized fields needed for links.

## Migration Plan

1. Add the join model to `prisma/schema.prisma`.
2. Create an additive migration for the join table with cascade deletes from `Hike` and `Track`.
3. Regenerate Prisma client through the project flow.
4. Deploy code that reads and writes associations after the migration is applied.

Rollback: revert the code and migration before production data depends on the table, or leave the unused join table in place and remove UI/actions if rollback happens after associations have been created. Do not delete existing hike, track, file asset, or parsed metadata records as part of rollback.

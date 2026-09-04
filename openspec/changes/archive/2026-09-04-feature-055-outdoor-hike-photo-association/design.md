## Context

See `proposal.md` for motivation. The current codebase already has independent `Hike` and `Photo` models, admin photo management under `/admin/photos`, public hike detail pages under `/hikes/[slug]`, image-backed photo records with ordered file assets, and stored photo EXIF/GPS extraction metadata.

The completed `feature-054-outdoor-hike-track-association` established the preferred pattern for outdoor many-to-many associations: additive join table, admin-only association actions, public read-model filtering, and explicit preservation of independent records and file assets.

## Goals / Non-Goals

**Goals:**

- Add a durable association between hikes and photos without changing existing hike, photo, image file asset, or extracted metadata identity.
- Let admins manage photo associations from admin surfaces while preserving server-side authorization.
- Store hike-specific photo ordering on the association so a photo can have different order positions in different hikes.
- Expose linked published photos on published hike pages with visibility-safe image fields.
- Keep public data helpers from exposing draft photos, draft hikes, private/inactive image assets, UploadThing provider URLs, or stored EXIF/GPS/error metadata.

**Non-Goals:**

- No public `/photos` listing or `/photos/[slug]` detail page.
- No public upload-from-hike workflow for creators or participants.
- No hike participant permission work.
- No album/grouping model beyond the association order foundation.
- No photo map markers, EXIF/GPS public display, or timestamp-based coordinate inference.
- No automatic photo-to-hike matching by date, GPS, filename, album, or metadata.

## Decisions

### Use a join table with hike-specific ordering

Add a Prisma join model such as `HikesToPhotos` with `hikeId`, `photoId`, `position`, `assignedAt`, and `updatedAt`, plus composite uniqueness on `[hikeId, photoId]`. The `position` belongs to the association rather than the `Photo` row because the same photo may appear in multiple hikes with different ordering.

Alternative considered: add nullable `hikeId` and `position` to `Photo`. That would be simpler for a one-hike-only model, but it would make reused photos, later albums, and imported/shared photo sets harder.

### Keep association management admin-only in this slice

Attach, detach, and reorder actions should require admin authorization server-side. Future public upload workflows can introduce creator/participant permissions once participant membership is implemented.

Alternative considered: let hike creators associate photos immediately. That overlaps with the upcoming participant/contribution model and risks adding temporary permission rules that will need to be replaced.

### Reuse existing photo image selection as the public display source

Public hike rendering should use the photo's existing ordered image assets and only expose fields already safe for public image display. The slice should not expose raw provider URLs, private/inactive assets, extracted EXIF/GPS data, camera labels, or extraction errors.

Alternative considered: create separate public photo derivatives or public photo routes now. That belongs to later gallery/media work and is not needed to prove hike-linked photos.

### Extend public hike read models with filtered associated photos

`getPublicHikeBySlug` should include only associated photos with `PUBLISHED` status and public-display-eligible image assets. Admin read models can include draft associations because admins need review visibility.

Alternative considered: fetch linked photos separately inside the page component. Keeping filtering in data helpers matches existing public visibility boundaries and reduces accidental leakage.

### Revalidate hike-facing surfaces after association changes

Attach, detach, and reorder actions should revalidate `/admin/hikes`, `/admin/photos`, and affected public hike detail paths when slugs are available. Photo management changes that affect public display should also revalidate linked public hikes when practical.

Alternative considered: revalidate only the current admin page. That risks stale public photo sections after association or publication changes.

## Risks / Trade-offs

- Migration adds a new relational table -> Mitigation: make it additive and preserve all existing `Hike`, `Photo`, `FileAsset`, photo image, and metadata rows.
- Ordered associations can develop gaps or duplicates -> Mitigation: normalize order during attach/reorder writes and rely on deterministic secondary sorting.
- Public image rendering could accidentally expose provider URLs -> Mitigation: reuse app-owned public file URL helpers or existing visibility-safe file fields, and keep provider URL fields out of public DTOs.
- Admin UI can become crowded if controls live directly in table cells -> Mitigation: prefer compact dialogs or row actions consistent with existing admin table patterns.
- Multi-image photos may need a clear thumbnail choice -> Mitigation: use the existing first ordered photo image as the public card/preview source unless the current photo model already defines a primary image.

## Migration Plan

1. Add the join model to `prisma/schema.prisma`.
2. Create an additive migration for the join table with cascade deletes from `Hike` and `Photo`.
3. Regenerate Prisma client through the existing project flow.
4. Deploy code that reads and writes associations after the migration is applied.

Rollback: revert code and migration before production data depends on the table, or leave the unused join table in place and remove UI/actions if rollback happens after associations have been created. Do not delete existing hike, photo, image file asset, or extracted metadata records as part of rollback.

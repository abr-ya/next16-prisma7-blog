## Context

The project already has outdoor `Hike` and `Track` models, a first-party `FileAsset` table, and UploadThing routes for general files and GPX track uploads. Existing image-oriented routes are still legacy URL-only surfaces, so outdoor photos need a tracked upload path instead of reusing `imageUploader`.

## Goals / Non-Goals

**Goals:**

- Add the first outdoor photo domain model and admin management flow.
- Store photo image files as first-party `FileAsset` rows with a dedicated purpose.
- Support uploading and binding 1-3 images per photo while preserving file lifecycle boundaries.
- Keep public and metadata-rich photo features ready for later slices without implementing them now.

**Non-Goals:**

- Do not add public photo gallery routes.
- Do not parse EXIF, GPS, camera/lens, or captured-at metadata.
- Do not associate photos with hikes/tracks or render photo map markers.
- Do not delete provider objects when photos are edited or deleted.

## Decisions

### Add `Photo` plus an ordered attachment model

Use a `Photo` model for user-facing photo metadata and a separate `PhotoImage` join model for one to three image file assets. This keeps the first slice compatible with multi-image photos and future manual ordering without putting repeated file columns on `Photo`.

Alternative considered: a single `Photo.fileAssetId` relation. That is simpler for one image, but it immediately conflicts with the roadmap requirement for 1-3 file upload support and would require an avoidable migration later.

### Add photo-specific enum values

Add `PhotoStatus` with `DRAFT` and `PUBLISHED` to mirror hikes/tracks, and add a photo-specific `FileAssetPurpose` value such as `OUTDOOR_PHOTO_IMAGE`. A dedicated purpose lets validation reject generic or GPX assets and makes file admin filters/readability better.

Alternative considered: reuse `PREVIEW_IMAGE` or `ADMIN_UPLOAD`. That would blur intent and make it harder to distinguish outdoor photo source files from supporting images.

### Keep image files private by default

The upload route should record photo image `FileAsset` rows with `PRIVATE` visibility by default. Public exposure is deferred until the public gallery slice defines which published photos and image URLs are visible.

Alternative considered: store new photo images as `PUBLIC` immediately. That would make upload testing easier, but it would define public file behavior before the gallery and visibility contract exists.

### Reuse the existing admin/outdoor structure

Follow the established tracks/hikes pattern: server-only data helpers under `app/_data`, server actions under `app/_actions`, admin page under `app/admin/photos`, admin UI under `components/admin-pages`, and small domain helpers under `lib`.

Alternative considered: build photo management as a generic file manager extension. Photos are content records with publication status and future outdoor associations, so keeping a separate outdoor domain boundary is clearer.

## Risks / Trade-offs

- Schema migration touches existing `User` and `FileAsset` relations -> keep the migration additive and do not rewrite existing migrations.
- Multi-image binding can leave uploaded files unattached if the admin abandons the form -> preserve them as active file assets for now and rely on existing/future cleanup lifecycle work.
- Private default visibility means no public preview contract is created yet -> admin UI can use authenticated/admin surfaces for review, while public rendering waits for the gallery slice.
- UploadThing image MIME behavior may differ by browser/provider -> validate by route type/limits and keep app-side photo file eligibility checks explicit.

## Migration Plan

1. Add additive Prisma schema changes for `PhotoStatus`, `Photo`, `PhotoImage`, and the outdoor photo image `FileAssetPurpose`.
2. Generate/apply the migration and regenerate Prisma client through the project flow.
3. Add upload route, server validation/actions, admin UI, and navigation.
4. Validate TypeScript, linting, Prisma behavior, and build locally before implementation is considered complete.

Rollback is a normal code rollback plus database rollback only before production data depends on the new tables. Once photos are created, rollback requires preserving or exporting affected `Photo`, `PhotoImage`, and related `FileAsset` rows.

## Context

See proposal.md for motivation. The project already has first-party outdoor `Photo` records, ordered `PhotoImage` rows, private `OUTDOOR_PHOTO_IMAGE` file assets, and admin-only `/admin/photos` management. Unlike `Track`, `Photo` currently has no `metadata` field. `Track.metadata` already uses a versioned JSON payload and typed readers in `lib/track-gpx-metadata.ts`, which is the closest local pattern.

## Goals / Non-Goals

**Goals:**

- Add durable, versioned photo metadata that can store EXIF extraction state and normalized GPS coordinates when available.
- Keep parsing server-side and admin-triggered, with safe failure handling.
- Make admin photo management show enough metadata state to tell whether extraction worked, failed, or needs refresh.

**Non-Goals:**

- No public photo gallery or public photo detail pages.
- No public coordinate, map marker, reverse-geocoding, or location-name display.
- No automatic photo-to-track timestamp matching.
- No bulk background job system; per-photo admin refresh is enough for this slice.

## Decisions

1. Store photo extraction data in `Photo.metadata Json?`.
   - Rationale: this mirrors the established `Track.metadata` pattern and avoids overfitting a relational schema before EXIF/GPS fields prove stable.
   - Alternative considered: dedicated columns for every EXIF field. Deferred because EXIF varies heavily across cameras and phones.

2. Use a versioned metadata contract, tentatively `photo-exif-metadata/v1`.
   - Rationale: later slices can add public gallery fields, GPS privacy controls, or per-image richer metadata without guessing the shape now.
   - Metadata should include extraction status (`SUCCESS`, `FAILED`, `STALE`), parsed timestamp, parser version, current source image file ids/keys, a summary object, and optional safe error message.

3. Treat GPS as captured metadata, not public content.
   - Rationale: photo GPS is sensitive. Storing it admin-only gives future hike maps and matching workflows a foundation while preserving an explicit public visibility decision for later.
   - The first valid coordinate in ordered photo images becomes the primary coordinate. Per-image source metadata records which file supplied it.

4. Extraction should run from server actions and fetch current file URLs only inside authenticated admin workflows.
   - Rationale: parsing image bytes belongs on the server, and public pages must not fetch private provider URLs or raw image metadata.
   - Create/update should mark metadata stale when image file identities change. A dedicated refresh action can parse or reparse the current images.

5. Prefer existing dependencies first, then add a focused parser if needed.
   - `sharp` is present through Next's dependency tree and can read image dimensions/orientation plus raw metadata buffers in some cases.
   - If implementation cannot reliably normalize capture date, camera fields, and GPS using installed packages, add a small EXIF parser such as `exifr` rather than hand-parsing TIFF/EXIF structures.

## Risks / Trade-offs

- [Risk] GPS metadata can expose sensitive home/travel locations. -> Mitigation: store it only in admin-readable metadata for this slice and do not add public routes or public serialized fields.
- [Risk] Provider URLs may expire or private image fetches may fail. -> Mitigation: record failed extraction states with safe errors and allow retry.
- [Risk] EXIF formats vary by device and app. -> Mitigation: keep a safe normalized summary plus versioned raw subset, and tolerate missing fields.
- [Risk] Adding a parser dependency increases maintenance surface. -> Mitigation: first verify existing tooling, then add only a focused dependency if GPS extraction needs it.
- [Risk] Existing photos will not have metadata immediately after migration. -> Mitigation: show missing/pending state and provide per-photo refresh.

## Migration Plan

- Add nullable `Photo.metadata` with a Prisma migration. Existing photo rows remain valid with `null` metadata.
- Regenerate the Prisma client through the existing project flow.
- Deploy code that treats missing metadata as a normal pending state.
- Rollback is low-risk because existing photo records and file assets are preserved; only newly captured metadata would be ignored by older code.

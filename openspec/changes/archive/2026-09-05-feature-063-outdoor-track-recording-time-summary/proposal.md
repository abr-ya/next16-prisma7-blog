## Why

Admins and readers need to see track recording start/end times directly on track cards so timezone mismatches with photo capture times are obvious before inferred photo coordinates are persisted. Track time parsing should also expose whether GPX timestamps carried timezone/UTC evidence or were ambiguous.

## What Changes

- Show compact recording start and finish date-times for parsed tracks wherever track summary cards already appear: `/admin/tracks`, public `/tracks`, public `/tracks/[slug]`, and linked-track cards on `/hikes/[slug]`.
- Add visible timezone evidence for parsed track times: UTC/offset present, timezone missing/ambiguous, or no timestamp data.
- Parse/store a small time provenance summary from GPX trackpoint timestamps without changing the track table schema.
- Keep display visibility-safe: no raw GPX provider URLs and no raw file content in public pages.
- Leave manual timezone override and photo-time correction to a follow-up if the displayed evidence proves it is needed.

Non-goals:

- No Prisma schema migration.
- No full timestamped trackpoint timeline retention in this slice.
- No inferred photo coordinate persistence.
- No automatic timezone correction for EXIF photo times.
- No manual track timezone override UI yet.
- No broad redesign of public track pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: Parsed GPX track summaries include recording start/end display and timezone evidence across admin and public track surfaces.

## Impact

- Affected routes: `/admin/tracks`, `/tracks`, `/tracks/[slug]`, `/hikes/[slug]`.
- Affected parser/helpers: GPX parsing metadata and formatting helpers for track recording times.
- Affected data: existing `Track.metadata` JSON shape only; no migration.
- Follow-up: photo/track matching persistence should use these timezone signals and may add manual timezone/offset correction later.
- Validation: OpenSpec strict validation, TypeScript, lint, local build, and browser checks on parsed tracks with `Z`, explicit offsets, missing timezone, and no timestamps.

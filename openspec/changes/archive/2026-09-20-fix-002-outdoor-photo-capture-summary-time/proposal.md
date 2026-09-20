# Proposal

## Why

Photos whose EXIF contains a timezone-less `CreateDate` currently display `Captured: Unavailable` and cannot receive a linked-track timezone assumption. The parser retains the camera-local time per image, but summary aggregation drops it because it selects only an image with an already absolute `capturedAt` value.

## What Changes

- Preserve valid camera-local capture-time provenance in the photo summary when no EXIF offset is available.
- Let the existing single-linked-track timezone path derive the matching instant and produce the existing coordinate-review candidates.
- Keep timezone-less EXIF time explicitly unconfirmed; never reinterpret it in the process/browser timezone.

## Capabilities

### New Capabilities

None. This corrects the existing `outdoor-hike-media-map` requirement for a single confirmed linked-track timezone; `skip_specs: true` is set because requirements do not change.

### Modified Capabilities

None.

## Impact

- Affected modules: `lib/photo-exif-parser.ts`, stored photo EXIF metadata, photo-detail capture display, and existing track-time candidate construction.
- Affected authorized public trip-photo review surface: it will show valid unconfirmed camera-local time and candidates where the existing policy permits them.
- No schema, migration, dependency, role/access, public URL, or direct-GPS behavior changes.

## Non-Goals

- Accepting `ModifyDate` as a capture-time fallback.
- Inventing an absolute instant when the trip has zero or multiple linked timezones.
- Adding manual capture-time entry or changing manual coordinate policy.

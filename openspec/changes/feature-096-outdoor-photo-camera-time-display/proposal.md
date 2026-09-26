# Proposal

## Why

People expect a photo's capture time to mean the camera-local time shown when it was taken. Current offset-backed EXIF parsing correctly derives UTC but discards that primary camera-time presentation, forcing viewers to infer it from UTC. Preserve and show the source camera time first, while retaining UTC as the exact comparable instant.

## What Changes

- Preserve the original camera-local EXIF timestamp and its numeric offset when both are available, alongside the existing derived UTC instant.
- In authorized trip-photo details, show camera-local capture time as the primary value; show stored UTC and the applicable timezone/offset as supporting context.
- When EXIF lacks an offset, retain the existing unconfirmed wall-clock value and surface an unambiguous linked-track IANA timezone as a proposed assumption. Let only the photo owner or an administrator confirm or replace that timezone through the existing safe confirmation workflow.
- Identify legacy offset-backed metadata that has UTC but lacks preserved camera-local time/offset, and recommend authorized EXIF refresh so the original can be restored from the file when available.

### Non-goals

- Inferring a geographic IANA timezone from GPS coordinates, browser location, or a third-party service.
- Guessing an IANA timezone from a numeric EXIF offset, changing an offset-backed photo's authoritative UTC instant, or automatically applying a track timezone where more than one candidate exists.
- Bulk-reparsing existing photos or exposing EXIF/camera-time diagnostics to anonymous or unrelated users.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-photos`: Preserve and present source camera-local time and offset, while making timezone uncertainty, track-based suggestions, confirmation, and legacy-refresh guidance observable to authorized photo viewers.

## Impact

- Affected data: versioned JSON EXIF metadata and its parser/normalizer; no Prisma schema migration is expected.
- Affected UI: authorized photo details and existing owner/admin EXIF/timezone controls on `/trips/[slug]`; admin photo metadata summaries should use the same source-time representation.
- Affected access: camera-time refresh guidance and timezone confirmation remain owner-or-admin actions; other viewers retain their current safe read-only detail boundary.
- Existing coordinate matching continues to use absolute UTC instants only after existing evidence or a confirmed/safely proposed IANA timezone permits one.

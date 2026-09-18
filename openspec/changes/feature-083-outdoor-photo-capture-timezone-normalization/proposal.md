## Why

Photos whose cameras omit an EXIF timezone currently risk being treated as if their local wall-clock time were UTC, which can shift track-time coordinate matching by hours. Photo owners need a safe default that uses known trip-track context while retaining an explicit correction path.

## What Changes

- Preserve EXIF timestamps without an offset as camera-local wall-clock values rather than invented UTC instants.
- When exactly one linked published track has a confirmed IANA recording timezone, use it as a labelled default assumption to derive a matching instant.
- Let an authorized photo owner or administrator explicitly choose an IANA timezone when the default is unavailable or incorrect, then recompute eligible track-time candidates.
- Keep original EXIF wall-clock evidence and timezone-assumption provenance; do not bulk-mutate historical photos or silently replace approved coordinates.

## Non-goals

- Infer timezone from GPS coordinates, use a fixed UTC offset, or silently choose among multiple track timezones.
- Bulk-confirm historical photos, alter raw EXIF data, or change direct-GPS coordinate priority.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-photos`: Define safe storage, display, and confirmation behavior for timezone-less camera capture times.
- `outdoor-hike-media-map`: Require track-time coordinate matching to use only confirmed or explicitly assumed IANA timezone instants.

## Impact

- Affects photo EXIF parsing/metadata, authorized trip photo details and coordinate review, track-time candidate generation, and existing inferred-coordinate review.
- May require additive persisted timezone-assumption metadata but no raw EXIF rewrite or new dependency.

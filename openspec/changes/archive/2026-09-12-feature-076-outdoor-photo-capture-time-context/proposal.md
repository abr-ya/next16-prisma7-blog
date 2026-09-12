## Why

Photo capture details currently show a browser-local clock without identifying its timezone, while track recording windows show their explicitly selected recording timezone. An administrator can therefore see two similar clock times and reasonably expect a match even when the stored absolute instants differ and the coordinate-review flow correctly chooses a previous-day finish candidate.

## What Changes

- Show the stored absolute capture timestamp and its timezone evidence in authorized photo details and the coordinate-review dialog, alongside the readable local display.
- In track-time coordinate review, show the selected source track's recording-time range in its explicit track timezone and provide an unambiguous UTC comparison for the photo timestamp and candidate boundaries.
- Make the previous-day-finish explanation inspectable: an administrator can see why a photo is before a same-day track start rather than relying on unlabelled clock values.

### Non-goals

- Correcting or normalizing EXIF timestamps that lack a trustworthy offset; that remains the separate `outdoor-photo-capture-timezone-normalization` candidate.
- Changing stored photo/GPX instants, timezone inference, candidate ranking, coordinate placement, or public map visibility.
- Adding photo metadata to unauthorised or anonymous gallery surfaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-photos`: Authorized photo capture details identify the stored timestamp's timezone context rather than presenting an ambiguous viewer-local clock alone.
- `outdoor-hike-media-map`: Authorized track-time coordinate review exposes enough labelled timestamp context to explain candidate selection without changing matching behavior.

## Impact

- Affected UI: authorized trip photo details and the admin/authorized coordinate-review dialog.
- Affected data: existing versioned photo EXIF metadata, stored capture timestamp/evidence, and persisted track recording timezone; no schema or migration is needed.
- Affected helpers: photo timestamp formatting and track-time candidate presentation only. Matching continues to compare absolute instants.

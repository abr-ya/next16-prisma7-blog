## Why

GPX timestamps are currently parsed as correct absolute instants, but recording times are formatted in each viewer's browser timezone. A Sofia track recorded at `10:35Z` can therefore appear as `13:35` to a UTC+3 viewer instead of the track-local `12:35`, making time-based photo-coordinate review unreliable.

## What Changes

- Store an explicit IANA recording timezone for each track, selected or corrected through an administrator action instead of inferred from the later viewer's browser.
- Show the current recording timezone in the administration list and provide a focused control that proposes the browser timezone as a convenience while allowing the administrator to select another supported IANA timezone.
- Format all track recording-time summaries using the stored track timezone, consistently in administration and public track/trip surfaces.
- In authorized photo details and track-time coordinate review, show the photo's stored UTC instant and timezone evidence alongside source-track ranges rendered in their persisted recording timezone.
- Preserve GPX timestamp instants, duration calculations, timeline ordering, and photo-to-track coordinate matching; changing the display timezone SHALL never rewrite or shift stored point times.
- Provide a safe legacy fallback for existing tracks that have no confirmed timezone, while making the missing setting visible for correction.

### Non-goals

- Deriving a timezone from route coordinates, reverse geocoding a city, or adding an AI agent; that remains the separate `outdoor-track-timezone-from-route` backlog candidate.
- Reinterpreting GPX values that omit an offset, altering GPX parsing algorithms, or changing the underlying absolute timestamps.
- Broadening track administration or public coordinate visibility and photo-review permissions.
- Correcting or normalizing an EXIF capture time whose source offset is missing or wrong; that remains the separate `outdoor-photo-capture-timezone-normalization` candidate.
- Completing unrelated deferred feature-074 coordinate-review QA.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: Add an explicit per-track recording-timezone selection and timezone-stable rendering of stored GPX instants across track administration, published track/trip summaries, and authorized photo-to-track time comparison.

## Impact

- Affected data model: `Track` gains a persisted, validated IANA recording-timezone value with a backward-compatible path for existing rows; parsed GPX metadata remains absolute-time data.
- Affected routes and UI: `/admin/tracks`, `/tracks/[slug]`, trip surfaces that render a linked track's recording-time summary, and authorized photo detail/coordinate-review surfaces.
- Affected server/client boundaries: the browser only proposes its timezone; server actions validate and persist an allowed IANA identifier, and all formatting receives the stored track setting explicitly.
- No new runtime dependency, external geocoding service, or AI integration is expected.

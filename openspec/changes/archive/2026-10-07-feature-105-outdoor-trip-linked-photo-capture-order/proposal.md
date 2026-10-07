# Proposal

## Why

Trip photo galleries currently follow manually assigned association positions, so a trip story can appear out of capture sequence. Visitors need chronological viewing by default while retaining the deliberate manual arrangement as an explicit alternative.

## What Changes

- Default published trip photo galleries and their authenticated lightbox navigation to ascending stored capture time.
- Provide an always-visible, localized `Capture time` / `Manual order` selector; disable it when both modes produce the same sequence.
- Keep the selected mode in `photoOrder` alongside the existing `photo` URL parameter, updating it with native `history.replaceState` without route navigation or extra history entries.
- Put photos without a reliable stored capture instant after dated photos in chronological mode, retaining manual position among those photos.
- Show a persistent accessible red information icon before an undated photo's card title in either mode, with localized tooltip text explaining the unavailable capture date and its chronological fallback.
- Add the small EN/RU Trips locale resource needed by the selector, disabled-state explanation, and alert tooltip.

## Non-goals

- Manually entering or changing a photo capture date; that remains the P2 `outdoor-photo-manual-capture-date` candidate.
- Re-parsing EXIF, changing photo metadata, association positions, visibility rules, or map-coordinate behavior.
- Adding photo-order history entries, server navigation, or a broader localization pass for the existing gallery copy.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `outdoor-hike-media-map`: Published trip photo galleries gain URL-addressable chronological and manual ordering with explicit undated-photo feedback.

## Impact

- Affects the public trip data projection, `HikeTripMedia`, and `HikePhotoGallery`, including lightbox next/previous behavior.
- Extends the existing i18n configuration and EN/RU resources with Trips-specific UI text.
- Uses already stored photo capture metadata; no Prisma schema, migration, raw EXIF read, or new dependency is expected.

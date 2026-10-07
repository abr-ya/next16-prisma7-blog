# Design

## Context

See [proposal.md](./proposal.md) for motivation. Public trip photos are currently returned in persisted association `position` order, and the existing client `HikeTripMedia` already synchronizes selected `photo` query state with native history replacement. Photo EXIF metadata can supply a stored capture instant, while absent or timezone-unreliable values must not be presented as a known instant.

## Goals / Non-Goals

**Goals:**

- Derive a visibility-safe reliable capture-instant sort key from already stored photo metadata.
- Keep one ordered photo array as the source for gallery cards, selected-photo lookup, and viewer navigation.
- Expose the selected ordering in the URL without triggering a route transition.
- Localize only new Trips ordering and unavailable-date UI in EN/RU.

**Non-Goals:**

- No EXIF refresh, metadata mutation, manual date entry, or database migration.
- No browser-local date parsing, timezone guessing, or changes to map markers and photo access.

## Decisions

### Derive ordering data from stored metadata

The server-side public trip projection will expose a nullable reliable capture instant for each linked photo by reusing the existing parsed metadata and any already confirmed normalization. The client will receive the manual association order plus that scalar and derive chronological order locally. Dated entries sort ascending; null entries sort afterward, preserving their original manual order through a stable comparison.

Alternative considered: re-reading EXIF or ordering JSON directly in Prisma. Both add avoidable work or coupling; the current stored metadata is the authority for this view.

### Make URL state replace-only

`HikeTripMedia` will validate `photoOrder` (`capture` default, `manual` explicit), preserve it alongside `photo`, and update both with `window.history.replaceState`. It will not call Next router navigation methods for selection or ordering changes. This deliberately keeps browser Back focused on page navigation rather than replaying gallery controls and avoids server rerenders that previously made deep-link interactions feel slow.

Alternative considered: `pushState` for every interaction. It would make the state replayable through Back but produces noisy history and was explicitly rejected.

### Use a persistent visible control and feedback

The gallery header owns an always-present compact order selector. It disables only when the computed sequences are identical. Each undated card shows an in-flow alert before its title rather than an image overlay, so the warning remains readable and does not obstruct photo actions.

### Extend the existing locale resource pattern narrowly

Add a `trips` namespace to i18n settings/configuration, EN/RU JSON resources, and root-provider resource loading. The client gallery reads only this namespace for its new labels, disabled explanation, alert label, and tooltip. Existing hard-coded gallery copy is out of scope.

## Risks / Trade-offs

- [Metadata has a camera-local time without a reliable instant] → Treat it as undated for ordering and show the explicit alert instead of guessing a timezone.
- [Changing sort while a viewer is open changes its index] → Keep selection by photo ID, then resolve the current index against the single ordered array.
- [URL parameters are malformed or stale] → Fall back to chronological order and ignore unknown `photoOrder` values without failing the page.
- [Localized resource unavailable] → Use configured English fallback through existing i18n behavior.

## Migration Plan

1. Deploy without data migration; existing metadata immediately determines each photo's sort eligibility.
2. Existing links with only `?photo=` retain their selected-photo behavior and default to chronological order.
3. Roll back by removing the client ordering control and projection field; no stored photo or association data changes.

# Design

## Context

See `proposal.md` for motivation. `TripPage` currently builds the visible gallery server-side, while `HikeTripMedia` and `HikePhotoGallery` are client components that open a selected photo through an imperative gallery handle. The gallery already owns viewer selection, keyboard navigation, and the Next router used for refreshes.

## Goals / Non-Goals

**Goals:**

- Initialize viewer selection from the `photo` search parameter only when it identifies a current gallery photo.
- Reflect selected-photo changes and viewer closing in the address bar without scrolling or server navigation.
- Preserve the existing authenticated full-size viewer and guest sign-in guidance.

**Non-Goals:**

- Add routes, database fields, server actions, or photo-specific metadata.
- Make deep links bypass viewer authorization or change map-selection behavior.

## Decisions

### 1. Keep query parsing and URL synchronization in the client media boundary

`HikeTripMedia` will read the current `photo` search parameter and coordinate it with the gallery handle. The gallery will notify its parent when its selected photo changes or closes; the parent will use a shallow, non-scrolling URL replacement.

Alternative: parse the parameter in the server page and pass an initial ID only. Rejected because viewer navigation and closing still require client URL synchronization and can otherwise race with hydration.

### 2. Validate against the rendered gallery collection

Only an ID present in the current `photos` collection can select a gallery item. The existing `openPhotoById` authorization check remains the sole control for opening a full-size image.

Alternative: add a separate server lookup for the query ID. Rejected because the page already has the visibility-filtered gallery collection and a second lookup adds surface area without improving access control.

### 3. Treat the URL as a selection request, not an access grant

For a guest, a valid parameter may invoke existing sign-in guidance but must not create a full-image URL or expose protected details. Invalid IDs are ignored without changing the route.

Alternative: redirect guests or remove the parameter. Rejected because it makes shared links unstable and is unnecessary for the established access boundary.

## Risks / Trade-offs

- [Risk] URL changes could re-open a just-closed viewer → Mitigation: keep selection-to-URL and URL-to-selection effects identity-aware and avoid redundant updates.
- [Risk] A cross-trip ID could disclose photo existence → Mitigation: resolve only against the already visible gallery collection and leave the page unchanged on mismatch.
- [Risk] Browser back/forward can change the query parameter → Mitigation: respond to search-parameter changes through the same validated selection path.

## Migration Plan

1. Extend only the client trip-media/gallery coordination; no data migration or deployment sequencing is required.
2. Verify direct opening, navigation, close, invalid IDs, guest behavior, and browser history on a published trip.
3. Roll back by removing query coordination; URLs return to normal trip pages and no persisted data is affected.

## Context

The current client-side trip photo gallery owns the active-photo state, previous/next navigation, and large-photo dialog. Authorized photo details are currently rendered as normal dialog content beneath the image, so toggling them changes the dialog's effective content height. See `proposal.md` for motivation and the delta spec for required behavior.

## Goals / Non-Goals

**Goals:**

- Keep one active-photo state and one lightbox instance for gallery navigation.
- Surface position context from that state and render details in an image-relative layer that does not participate in dialog layout.
- Preserve existing server-derived authorization and visibility-safe detail projections.

**Non-Goals:**

- No shared map/lightbox state, new viewer route, new media fetch, data-model change, or authorization change.
- No rework of the separate EXIF-refresh or coordinate-review dialogs.

## Decisions

### Derive the position label from the existing active index

The viewer will display `activeIndex + 1` and `photos.length` when a photo is active. This uses the same stored gallery order as previous/next navigation, so the label cannot disagree with the visible sequence. A separate counter state was rejected because it could become stale after navigating or closing the viewer.

### Place authorized details inside an image-relative overlay

The viewer's image container will be the positioning context. The existing details summary and map-focus action will render in a bounded, semi-transparent absolutely positioned panel over that container. It may scroll internally if its own content exceeds its bounded area, but it will not expand the dialog or alter photo layout. Rendering details below the image was rejected because it is the source of the geometry and page-scroll disruption.

### Keep detail authorization and data projection unchanged

The server page will continue deciding `detail` availability and the client will only expose the overlay when that existing projection is present. This preserves the owner/creator/participant/admin boundary and prevents an overlay UI change from widening metadata access.

## Risks / Trade-offs

- Overlay content can obscure part of a portrait or narrow photo → bound it to a corner, use transparent styling, and keep the image and close/navigation controls usable.
- Long metadata can exceed the useful overlay area → contain scrolling within the overlay rather than the dialog.
- Responsive viewport changes can tighten the viewer → use existing viewport-based dialog/image constraints and verify keyboard navigation plus close behavior on narrow screens.

## Migration Plan

1. Deploy the client-only viewer composition change with no migration or data backfill.
2. If a regression occurs, revert the component change; stored photos, authorization, and URLs are unaffected.

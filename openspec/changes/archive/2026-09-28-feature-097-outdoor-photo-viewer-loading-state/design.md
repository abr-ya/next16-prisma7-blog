# Design

## Context

See `proposal.md` for motivation. `HikePhotoGallery` is a client component whose full-size `<img>` changes directly with the active photo. It currently has no selected-image load lifecycle, so browser image replacement can leave the prior photo visible while a new source loads.

## Goals / Non-Goals

**Goals:**

- Track loading, loaded, and failed state for the active full-size photo.
- Make the selected photo identity and its rendered bytes agree at every point in the viewer.
- Preserve current keyboard/button navigation and authenticated image-access boundaries.

**Non-Goals:**

- Change server data, file delivery, image URLs, caching, preloading, or retry policy.
- Persist viewer state or alter photo details/comments overlays.

## Decisions

### 1. Track state by selected photo identity

The client viewer will reset image state whenever the active photo changes and use image `load`/`error` events only when they belong to that currently selected photo. This prevents a late event from a previous request from replacing the new selection's state.

Alternative: retain the previous image until the next one loads. Rejected because it makes the previous image look like the newly selected photo.

### 2. Replace image content with an in-viewer state

While loading or after failure, the image area will show a compact loading or error state instead of the prior full-size image. Navigation controls remain over the same viewer area so users can skip a slow or failed selection.

Alternative: disable navigation until completion. Rejected because it traps the viewer on a slow or unavailable image.

### 3. Keep existing access and details boundaries unchanged

The implementation remains entirely in the client gallery after `fullUrl` is already granted to an authenticated user. It does not request new URLs, log errors, or surface response details; details/comments behavior remains unchanged.

## Risks / Trade-offs

- [Risk] A late image event can race with a later selection → Mitigation: compare the event's photo identity with the active selection before updating state.
- [Risk] The loading state can feel visually abrupt → Mitigation: retain the viewer's fixed image area, title, ordinal, and navigation controls.
- [Risk] An error could reveal storage details → Mitigation: use one generic user-facing error message only.

## Migration Plan

1. Add local viewer state without database or server changes.
2. Validate authenticated first-load, next/previous, and failure behavior in a browser.
3. Roll back by removing the client-side state; existing file data and access rules remain untouched.

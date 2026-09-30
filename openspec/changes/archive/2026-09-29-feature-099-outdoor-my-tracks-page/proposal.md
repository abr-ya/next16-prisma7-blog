# Proposal

## Why

Signed-in users can already own GPX-backed tracks, but managing them requires entering the `/admin` workspace. A private "My tracks" page makes independent GPX upload and personal track management available from the public-site user menu, without requiring a trip association.

## What Changes

- Add an authenticated `/my/tracks` page, reachable from the signed-in user menu, which lists only the current user's tracks and clearly shows draft/published state and any existing trip association.
- Let the owner upload a valid GPX file and create an independent track from that page; a newly created track is not attached to a trip.
- Reuse the established owner-scoped track actions for editing, replacing the GPX file, selecting recording timezone, parsing, and deleting only the user's own tracks.
- Preserve `/admin/tracks` as the personal/admin workspace surface and preserve existing public `/tracks` visibility and download rules.

### Non-goals

- Attaching, detaching, or bulk-attaching tracks to trips.
- Participant track contribution, trip-page upload, and cross-user management.
- New GPX parsing formats, automatic timezone detection, or changes to public track pages.
- The separate "My photos" page; it will be proposed as the next feature after this slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: add authenticated, owner-scoped personal track listing and independent GPX upload while retaining current track and public-visibility behavior.
- `public-navigation`: add the signed-in user-menu entry point for the private My tracks route.

## Impact

- Routes: new `/my/tracks`; signed-in public navigation.
- Data/actions: existing `Track` and `FileAsset` records and current owner-scoped track actions; no schema or migration change expected.
- UI: a personal track management surface can reuse the existing track form, GPX uploader, parse status, confirmation dialog, and track formatting components.
- Authorization: server-side session and owner checks remain authoritative; track files and draft metadata are never exposed to another user or to anonymous visitors.

# Design

## Context

See [proposal.md](./proposal.md) for motivation. `getHikePhotoOptions` currently returns the first image's provider URL, and `HikePhotosDialog` renders that URL directly. The existing `/files/[fileId]/thumbnail` route produces a 640px WebP thumbnail but currently permits only guest-safe published trip-linked photo images, so it cannot serve every administrator-visible row.

## Goals / Non-Goals

**Goals:**

- Give the administrator dialog an app-owned thumbnail URL derived from the first image's stable file ID.
- Extend server-side thumbnail authorization narrowly for authenticated administrators viewing active outdoor-photo image assets.
- Retain the existing anonymous published-trip thumbnail rule and avoid original provider URLs in the dialog payload.

**Non-Goals:**

- No thumbnail persistence, cache-policy change, new image sizes, UploadThing change, or schema/migration.
- No change to public gallery, full-image download, photo associations, or general file preview behavior.

## Decisions

### Reuse the existing thumbnail route for administrator rows

`getHikePhotoOptions` will keep selecting only the first image's ID and name, and map it to the existing thumbnail route URL. `HikePhotosDialog` will use this value for its `<img>` source rather than `FileAsset.url`.

This avoids duplicate image transformations and lets the browser cache the same app-owned response format used by the public gallery. A direct provider URL is rejected because it bypasses the compact delivery path and unnecessarily exposes the provider URL to the browser.

### Add a narrow server-side administrator authorization branch

The thumbnail data helper will first require an active image asset. It will retain the current guest-safe allowance for published trip-linked outdoor photos. If that condition is not met, it will resolve the session and allow the request only when the viewer has the administrator role and the file asset has the outdoor-photo image purpose.

Authorization remains at the route's server-side data boundary; the client receives no provider URL. Broad authenticated-user access is rejected because a normal signed-in user must not gain access to drafts or unrelated photo assets.

### Preserve public behavior and error shape

The route continues generating the existing compact WebP response and keeps its existing not-found and access-denied outcomes. The new branch only makes otherwise-administrator-authorized assets eligible before the existing transformation logic.

## Risks / Trade-offs

- [On-demand transformations still fetch originals on a cold thumbnail request] → This narrow UI fix deliberately reuses the current route; persistent derivatives remain a separately planned feature.
- [An overly broad role or purpose check could expose private assets] → Require both authenticated administrator status and active outdoor-photo image purpose, and manually test anonymous and ordinary-user denials.
- [A thumbnail fails due to unavailable storage bytes] → Preserve the route's existing failure response and the dialog's normal broken-image/fallback browser behavior; do not fall back to a provider URL.

## Migration Plan

1. Deploy the server authorization and dialog data/UI changes together.
2. Verify an administrator can open **Manage photos** with draft and unlinked photos, while anonymous and ordinary-user thumbnail requests remain denied.
3. Roll back by restoring the previous helper and dialog source; no data migration or cleanup is required.

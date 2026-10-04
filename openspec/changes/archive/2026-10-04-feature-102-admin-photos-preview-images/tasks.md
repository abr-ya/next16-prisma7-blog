# Tasks

## 1. Administrator thumbnail authorization

- [x] 1.1 Extend the server-side thumbnail asset lookup so an authenticated administrator can retrieve an active `OUTDOOR_PHOTO_IMAGE` thumbnail even when the photo is draft or not linked to a published trip; verify anonymous and ordinary-user requests remain denied for those assets.
- [x] 1.2 Preserve the existing published-trip guest thumbnail authorization and existing compact WebP response/error behavior; verify no thumbnail response exposes a provider URL.

## 2. Admin photo-association previews

- [x] 2.1 Change hike photo option data to expose the first image's app-owned thumbnail path rather than its provider URL; verify the option carries only the values required by the dialog.
- [x] 2.2 Update the `/admin/hikes` **Manage photos** row to render the app-owned thumbnail path for both attached and available photos, retaining the existing no-image fallback and management controls; verify in a browser with draft/unlinked and published photos.

## 3. Validation and tracking

- [x] 3.1 Run `npm run tsc` and record a passing result.
- [x] 3.2 Run targeted ESLint for changed `app` and `components` files (and `npm run lint` when its scope covers the changed files) and record a passing result.
- [x] 3.3 `npm run build` passed locally on 2026-10-04; an administrator verified that a draft photo renders in **Manage photos** through `/files/[id]/thumbnail`. Runtime denial checks for anonymous and ordinary-user viewers are deferred to `outdoor-admin-thumbnail-access-manual-qa`.

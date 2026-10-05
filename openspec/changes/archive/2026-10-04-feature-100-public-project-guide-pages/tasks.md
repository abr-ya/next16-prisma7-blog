# Tasks

## 1. Guide content foundation

- [x] 1.1 Add English and Russian guide locale resources for the overview, account-level explanation, calls to action, and fallback-safe labels; verify all rendered guide copy resolves in both locales.
- [x] 1.3 Review account-level locale copy against the enforced trust gates, quotas, and promotion behavior that exist at implementation time; verify it distinguishes trust from role and contains no admin-only or user-specific information.

## 2. Public guide routes

- [x] 2.1 Implement the public `/about` overview in the existing public route group and verify anonymous and signed-in visitors see the overview, account-level link, and existing public section destinations with the shared navbar.
- [x] 2.2 Implement `/about/account-levels` and verify it is publicly readable, localized, and safely describes only the current general participation policy.

## 3. Discovery and responsive navigation

- [x] 3.1 Add a localized `/about` destination to the shared public navbar and verify existing primary links, back control, search placeholder, login state, and authenticated account menu remain available.
- [x] 3.2 Manually inspected the guide overview, account-level page, and navbar at narrow and desktop viewport widths in English and Russian on 2026-10-04; links worked and navigation did not overlap or hide essential controls.

## 4. Validation and documentation

- [x] 4.1 Run `npm run tsc` and verify TypeScript completes without errors.
- [x] 4.2 Run `npm run lint` plus targeted `npx eslint components/blog-pages/navbar.tsx --quiet` and verify the changed application and component files pass linting.
- [x] 4.3 `npm run build` completed successfully on 2026-10-04. The build emitted non-blocking `Couldn't load fs/zlib` messages while collecting page data, then generated all 13 static pages successfully.
- [x] 4.4 Updated the feature checklist and backlog status with implementation and manual browser-validation results on 2026-10-04; the change is ready for specification sync and archive.

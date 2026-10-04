# Tasks

## 1. Guide content foundation

- [ ] 1.1 Add English and Russian guide locale resources for the overview, account-level explanation, calls to action, and fallback-safe labels; verify all rendered guide copy resolves in both locales.
- [ ] 1.3 Review account-level locale copy against the enforced trust gates, quotas, and promotion behavior that exist at implementation time; verify it distinguishes trust from role and contains no admin-only or user-specific information.

## 2. Public guide routes

- [ ] 2.1 Implement the public `/about` overview in the existing public route group and verify anonymous and signed-in visitors see the overview, account-level link, and existing public section destinations with the shared navbar.
- [ ] 2.2 Implement `/about/account-levels` and verify it is publicly readable, localized, and safely describes only the current general participation policy.

## 3. Discovery and responsive navigation

- [ ] 3.1 Add a localized `/about` destination to the shared public navbar and verify existing primary links, back control, search placeholder, login state, and authenticated account menu remain available.
- [ ] 3.2 Manually inspect the guide overview, account-level page, and navbar at narrow and desktop viewport widths in both locales; verify links work and navigation does not overlap or hide essential controls.

## 4. Validation and documentation

- [ ] 4.1 Run `npm run tsc` and verify TypeScript completes without errors.
- [ ] 4.2 Run `npm run lint` plus targeted `npx eslint components/blog-pages/navbar.tsx --quiet` and verify the changed application and component files pass linting.
- [ ] 4.3 Run `npm run build` locally and verify the build completes; record any environment-specific result in the change notes.
- [ ] 4.4 Update the feature checklist and backlog status with implementation and manual browser-validation results before requesting archive.

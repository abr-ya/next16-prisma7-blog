# Tasks

## 1. Public trip contribution policy

- [x] 1.1 Extend the reusable photo-upload dialog with an optional, call-site-selected image-count policy; verify callers without that policy retain their current one-to-three-image behavior.
- [x] 1.2 Pass the single-image-by-default policy only from the public trip `Add photo` contribution dialog; verify its unchecked multi-image control permits one image and its checked state permits up to three.
- [x] 1.3 Preserve selected images without silent loss when multi-image mode is turned off; verify the contributor must remove surplus images before returning to one-image mode.

## 2. Regression coverage and validation

- [x] 2.1 Add or update focused coverage for the dialog policy and its trip-only invocation where the repository's existing test approach permits; verify default, opt-in, and unaffected-admin cases. No automated test harness exists in this repository; the behavior is covered by the required manual browser check below.
- [x] 2.2 Run `npm run tsc` and targeted ESLint for changed non-`app` files; verify both complete successfully.
- [x] 2.3 Run `npm run lint` if an `app` file changes, and ask the user to run `npm run build` locally; verify or record the result. No `app` file changed. User ran the local build on 2026-09-26; it was blocked by a network failure fetching the Geist font from `fonts.gstatic.com`, followed by Turbopack's unresolved internal font-module error.
- [x] 2.4 Manually verify in a browser as an authorized trip contributor: one image can be uploaded by default, two and three require opt-in, and the administrator photo create/edit form still accepts its existing one-to-three image range. Verified by the user on 2026-09-26.

## 3. Planning and backlog

- [x] 3.1 Keep the feature entry in `openspec/backlog.md` marked In Progress and validate this change with `openspec validate feature-095-outdoor-trip-photo-multi-image-opt-in --strict`.

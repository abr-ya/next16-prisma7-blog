## 1. Localization Setup

- [x] 1.1 Add `next-i18next`, `i18next`, and `react-i18next` dependencies.
- [x] 1.2 Add the project i18n config for supported locales `en` and `ru`, fallback locale `en`, and the `navigation` namespace.
- [x] 1.3 Add the package proxy or language detection wiring while excluding API, auth, UploadThing, Next internals, and static asset routes.
- [x] 1.4 Add the provider/root wiring needed for Server Component and Client Component translation access on public navbar routes.

## 2. Locale Resources

- [x] 2.1 Create `app/i18n/locales/en/navigation.json` with the shared public navbar labels.
- [x] 2.2 Create `app/i18n/locales/ru/navigation.json` with the matching Russian public navbar labels.
- [x] 2.3 Keep resource keys scoped to navbar/navigation copy so later page namespaces can be added without reorganizing the first slice.

## 3. Public Navbar Implementation

- [x] 3.1 Replace hardcoded shared public navbar labels with translated `navigation` namespace values.
- [x] 3.2 Add an English/Russian language switcher control to the public navbar.
- [x] 3.3 Preserve existing Home, Blog, Docs, Videos, and Comments navigation targets.
- [x] 3.4 Preserve existing back navigation, search placeholder access, and visitor login behavior.
- [x] 3.5 Preserve signed-in account menu behavior and server-side auth-session boundaries.

## 4. Documentation And Tracking

- [x] 4.1 Update docs or notes if implementation choices differ from `docs/public-localization-package-notes.md`.
- [x] 4.2 Ensure the OpenSpec change remains aligned with the accepted package and locale placement decisions.

## 5. Validation

- [x] 5.1 Run `npm run tsc`.
- [x] 5.2 Run `npm run lint`.
- [x] 5.3 Run targeted ESLint for changed files outside `app/` when applicable.
- [x] 5.4 Ask the user to run `npm run build` locally and paste the result before treating routing/user-facing behavior as fully validated.
- [x] 5.5 Manually verify the public navbar in English and Russian for visitor state.
- [x] 5.6 Manually verify the public navbar in English and Russian for signed-in state.

## Why

Visitors should be able to switch the shared public navbar between English and Russian, and the first shared navigation labels should render in the selected language. This starts localization with a narrow, visible public slice before translating full pages route by route.

## What Changes

- Add a public navbar language switcher for the supported locales `en` and `ru`.
- Adopt `next-i18next` as the project localization package for this slice.
- Store bundled locale resources under `app/i18n/locales/{language}/{namespace}.json`, starting with the `navigation` namespace.
- Translate the shared public navbar labels and controls that are currently hardcoded in the navbar.
- Preserve current public navbar behavior for section links, back navigation, search placeholder access, and auth-aware account/login access.
- Keep the first slice scoped to public navbar copy and localization wiring.

### Non-goals

- Do not translate full public pages such as Home, Blog, Docs, Videos, Comments, or content detail pages in this slice.
- Do not localize database content, slugs, markdown documents, posts, video metadata, tags, or comments.
- Do not add admin-facing localization UI or editable translation management.
- Do not introduce locale-specific route aliases beyond the routing needed for the navbar language switcher.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `public-navigation`: Add locale switching and localized shared public navbar labels while preserving the existing public navigation controls.

## Impact

- Affected public surfaces: shared public navbar on the public content layouts where it is currently mounted, including Blog and Videos routes.
- Affected routes: public navbar links for `/`, `/blog`, `/docs`, `/videos`, `/comments`, plus localized navigation behavior for the selected language.
- Affected code: `components/blog-pages/navbar.tsx`, navbar user-menu text if needed, public layouts that provide localization context, localization config, and locale resource files under `app/i18n/locales`.
- Dependencies: add `next-i18next`, `i18next`, and `react-i18next` unless an equivalent dependency is already present.
- Data models: no Prisma schema or database data changes.
- Admin surfaces: no admin behavior changes.

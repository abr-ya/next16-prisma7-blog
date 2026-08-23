## Context

The shared public navbar currently lives in `components/blog-pages/navbar.tsx` as a Client Component with hardcoded English labels. It is mounted by the Blog and Videos layouts and includes primary public links, a back control, a search placeholder icon, and auth-aware login/account access.

The project has no existing localization package, proxy, middleware, or locale resource directory. The package and locale placement comparison is captured in `docs/public-localization-package-notes.md`.

## Goals / Non-Goals

**Goals:**

- Add a reusable localization foundation that supports the first public navbar slice without forcing a full site translation.
- Keep translations in bundled app files under `app/i18n/locales/{language}/{namespace}.json`.
- Keep the shared public navbar usable for visitors and signed-in users in both supported locales.
- Preserve existing auth checks and public visibility behavior.

**Non-Goals:**

- Do not change Prisma models, migrations, or stored content.
- Do not translate database-backed content or route slugs.
- Do not add admin translation management.
- Do not redesign the public navbar beyond the controls needed for locale switching.

## Decisions

### Use `next-i18next` for the public localization foundation

Use `next-i18next` with `i18next` and `react-i18next` so the project can use namespaces and the wider i18next ecosystem while still supporting Next.js App Router behavior.

Alternatives considered:

- `next-intl`: simpler and strongly App Router-oriented, but less aligned with the selected i18next ecosystem path.
- Paraglide JS: attractive compile-time message model, but more new infrastructure than this first navbar slice needs.
- Minimal custom layer: lower dependency cost, but would make the project own fallback behavior, server/client boundaries, and future routing concerns.

### Store locale resources under `app/i18n/locales`

Use this structure for the first namespace:

```txt
app/i18n/locales/
  en/
    navigation.json
  ru/
    navigation.json
```

Configure `next-i18next` with a resource loader that dynamically imports these files. This keeps translation resources bundled with the application and avoids relying on runtime filesystem access to `public/locales`.

### Start with the `navigation` namespace

The first namespace should contain only shared public navbar copy such as the navigation label, primary section labels, back control, login text, account-menu labels if they are included in the visible navbar surface, and language switcher labels.

Future page-level namespaces can be added later without changing the first slice structure.

### Keep server and client boundaries explicit

Localization setup should initialize server-side translation access at the layout or shared provider boundary required by `next-i18next`. Client navbar components should consume hydrated translation resources through the client API rather than importing JSON files directly.

Public layouts that mount the navbar should continue to resolve the auth session server-side and pass only the existing safe user display props to the client navbar.

### Prefer a narrow routing mode for the first slice

The first implementation should support switching between `en` and `ru` without translating page content or database content. If locale-in-path routing is used, the implementation must avoid breaking existing public links and must preserve current public section targets. If no-locale-path cookie mode is used, the implementation must preserve clean URLs and update the selected locale through the package-supported language change flow.

The implementation choice between locale-in-path and no-locale-path mode can be finalized during coding as long as the spec behavior remains unchanged.

## Risks / Trade-offs

- Locale routing can unintentionally affect API, auth, UploadThing, or static asset routes -> Configure the proxy matcher to exclude non-page routes and assets.
- App Router localization wiring can force more layout movement than the first slice needs -> Keep provider placement as narrow as possible while still covering the navbar routes currently in scope.
- Client navbar hydration can drift if server and client locale sources disagree -> Use the package provider/hydration path consistently instead of separately importing locale JSON in the client component.
- Adding a dependency increases maintenance surface -> Keep the first namespace small and document package rationale in `docs/public-localization-package-notes.md`.
- Locale-in-path mode may require route tree changes -> Prefer the smallest routing mode that satisfies the navbar switcher behavior, and avoid page content localization in this slice.

## Migration Plan

1. Add the localization dependencies and config.
2. Add English and Russian `navigation` locale files under `app/i18n/locales`.
3. Add the package provider/proxy wiring needed for public navbar localization.
4. Update the shared public navbar to use translated labels and expose a language switcher.
5. Validate TypeScript, linting, and manually verify the navbar in both locales for visitor and signed-in states.

Rollback is straightforward: remove the localization provider/proxy wiring, restore hardcoded navbar labels, remove locale resources, and remove the added dependencies if no later feature uses them.

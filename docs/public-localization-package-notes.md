# Public Localization Package Notes

This note captures the package and locale-file placement thinking for the public navbar language switcher work.

## Context

The first localization slice is intentionally narrow:

- Add a language switcher to the shared public navbar.
- Translate the first shared navigation labels.
- Avoid a broad page-by-page localization migration in the same feature.

The project uses Next.js App Router, React Server Components, Client Components, and Next.js 16 conventions such as `proxy.ts`.

## Package Options

### next-intl

`next-intl` is the most focused App Router option. It has first-class Server Component and Client Component APIs, supports middleware/proxy-based locale negotiation, and provides navigation helpers for locale-aware links and route changes.

It is a strong default when the project wants a Next-native localization layer with less i18next ecosystem surface area.

Tradeoffs:

- Good fit for App Router.
- Good fit for URL-based locale routing and SEO-oriented alternate links.
- Smaller conceptual footprint than i18next.
- Less attractive if the project wants the larger i18next plugin and backend ecosystem.

### next-i18next

`next-i18next` is a strong choice when the project wants the i18next ecosystem while still supporting the App Router. Version 16 supports Server Components, Client Components, `proxy.ts`, locale-in-path routing, and cookie-based no-locale-path mode.

It is a good fit if we value i18next namespaces, familiar `t()` style APIs, future Locize or custom backend integration, and broad translation tooling.

Tradeoffs:

- Good App Router support in current versions.
- Strong namespace and plugin ecosystem.
- More moving parts than `next-intl` for a small first slice.
- Locale-file placement needs care for serverless-friendly deployments.

### Paraglide JS

Paraglide JS is a modern compile-time localization option with generated message functions and URL routing support.

It is interesting if the project wants type-safe compiled messages and inlang tooling. For this project, it likely adds more new concepts than needed for the initial navbar language switcher.

Tradeoffs:

- Strong compile-time message ergonomics.
- Interesting typed message API.
- More new infrastructure than the first public navbar slice requires.

### Minimal Custom Layer

A custom layer could use a small dictionary object, a locale cookie, and a local language switcher component.

This keeps dependencies low, but it pushes routing, fallback behavior, server/client boundaries, and future SEO behavior into project-owned code.

Tradeoffs:

- Lowest dependency cost.
- Fast for a tiny demo.
- Easy to outgrow.
- Risks becoming a local i18n library over time.

## Locale File Placement

For `next-i18next`, prefer bundled application locale files rather than `public/locales`.

Recommended structure:

```txt
app/i18n/locales/
  en/
    navigation.json
  ru/
    navigation.json
```

This keeps translations inside the application bundle and allows `next-i18next` to load them through a `resourceLoader` with dynamic imports:

```ts
resourceLoader: (language, namespace) =>
  import(`./app/i18n/locales/${language}/${namespace}.json`)
```

Why this placement is preferred:

- It is serverless-friendly because the translation files are bundled instead of relying on runtime filesystem access to `public`.
- It keeps shared public translations away from a single page or component folder.
- It scales naturally from the first `navigation` namespace to future namespaces such as `common`, `home`, `docs`, `videos`, or `comments`.
- It keeps translation ownership visible and easy to inspect from one stable location.

Avoid placing these first translations next to `components/blog-pages/navbar.tsx`. The navbar is a shared public component, and the translations will likely serve more than one route or layout.

Avoid starting with `public/locales` unless the deployment/runtime model explicitly makes runtime filesystem access safe and desirable.

## Current Leaning

If the project chooses `next-i18next`, use:

```txt
app/i18n/locales/{language}/{namespace}.json
```

For the first feature slice, start with:

```txt
app/i18n/locales/en/navigation.json
app/i18n/locales/ru/navigation.json
```

This gives the navbar switcher a clear namespace now and leaves room for later page-level localization without reorganizing the project.

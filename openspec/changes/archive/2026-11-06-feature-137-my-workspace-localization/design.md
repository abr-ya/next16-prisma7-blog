# Design

## Context

Localization already runs on `next-i18next` with three resource files: `navigation`, `guide`, and `trips` (`app/i18n/settings.ts`, `i18n.config.ts`, `app/layout.tsx`). Client components call `useT(namespace)`; server components call `getT(namespace)` after `initServerI18next(i18nConfig)`, as `app/(public)/about/page.tsx` does. The `i18next` cookie set by `components/blog-pages/navbar.tsx` is read by both server and client, so the workspace can follow the same language without a route segment.

The signed-in account menu (`components/blog-pages/navbar-user-menu.tsx`) already imports `navigationNamespace` and translates `dashboard` and `signout`, but the Profile, My tracks, My routes, My workouts, My gear, and avatar alt strings are literals. The four page files are server components with an English `PageLayout` title and English static metadata. `DataTable`, `ConfirmDialog`, and `useDeleteRowConfirm` are shared client primitives that render English defaults on both `/my/*` and admin surfaces.

## Goals / Non-Goals

**Goals:**

- Every workspace shell string in this slice follows the active interface language in both EN and RU.
- The namespace structure supports the follow-up page-body slices without another registration change.
- Shared primitives become language-aware without per-call-site changes.

**Non-Goals:**

- Page-body copy, form labels, dialogs, toasts, validation messages, and server-action messages of `/my/gear`, `/my/routes`, `/my/tracks`, and `/my/workouts`.
- Page metadata, date formatting, unit formatting, and database-backed content.
- Any change to navigation destinations, access rules, sorting, pagination, or confirmation behavior.

## Decisions

**Three resource homes.** Menu copy goes into the existing `navigation` namespace because the account menu is part of the public navbar. Page-shell copy goes into a new `workspace` namespace so the follow-up slices can add gear, route, track, and workout copy without touching `navigation` or `trips`. Shared primitive copy goes into a new `common` namespace because those components render across admin, public, and workspace surfaces. A single merged namespace was rejected: it would either mix navbar and page copy or force admin strings into `navigation`.

**Registration is explicit.** `app/i18n/settings.ts` gains `workspaceNamespace` and `commonNamespace`; `i18n.config.ts` adds them to `ns`; `app/layout.tsx` adds them to the `getResources` list. `defaultNS` stays `navigation`, so existing callers are unaffected.

**Server page titles use `getT`.** Each of the four `page.tsx` files calls `initServerI18next(i18nConfig)` and `await getT(workspaceNamespace)`, then passes `t("pages.<slug>")` to `PageLayout`. This matches the `/about` precedent and keeps the `<h1>` correct on first paint. Page `metadata` stays English: `/about` already behaves that way, and metadata localization would expand scope into `generateMetadata` for every page.

**Client primitives translate their defaults.** `DataTable` and `ConfirmDialog` call `useT(commonNamespace)` and use `t()` only when a prop was not supplied. `useDeleteRowConfirm` translates its "Delete" label the same way. Explicit `confirmLabel` / `cancelLabel` props keep winning, so existing callers that pass custom copy are untouched. Alternative of passing labels from every call site was rejected: it would touch dozens of admin and workspace panels for no behavioral gain.

**Key naming.** `navigation`: `profile`, `myTracks`, `myRoutes`, `myWorkouts`, `myGear`, `userAvatarAlt` (`{{name}}`), `userAvatarAltFallback`. `workspace`: `pages.myTracks`, `pages.myRoutes`, `pages.myWorkouts`, `pages.myGear`. `common`: `dataTable.noResults`, `dataTable.pageOf` (`{{page}}`, `{{count}}`), `dataTable.previousPage`, `dataTable.nextPage`, `confirmDialog.confirm`, `confirmDialog.cancel`, `actions.delete`.

**Russian copy follows the existing register.** Short nouns for menu entries (`Профиль`, `Мои треки`, `Мои маршруты`, `Мои тренировки`, `Моё снаряжение`) and existing page vocabulary from the archived features. The page summary reuses "Страница {{page}} из {{count}}" without plural suffixes, matching how the page counter is read.

**Fallback is inherited.** `i18n.config.ts` already declares `fallbackLng: "en"`; an unsupported locale resolves to English. Missing Russian keys are expected to be caught by locale parity review rather than by runtime fallback.

## Risks / Trade-offs

- Shared primitives now translate on admin pages too. That is intentional (the same controls should not switch language between surfaces), but it means an admin-only reviewer sees new Russian strings; behavior is unchanged.
- Two new JSON files are loaded for every page through the layout resource list. Their size is small, but the list must stay in sync with `i18n.config.ts`; a missed entry makes `useT` render raw keys.
- Server pages and client primitives read the same cookie, but the language switch relies on `router.refresh()`. A stale client cache would show mixed languages; the browser check covers switching on an owner page.
- The slice leaves four page bodies in English, so the workspace is only partially localized until the follow-ups land. The backlog records those slices so the gap is explicit.

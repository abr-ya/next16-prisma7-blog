# Proposal

## Why

The owner workspace is still hardcoded English even though the public site already switches between English and Russian. A signed-in user who chooses Russian sees a Russian navbar and then an English account menu, English page titles, an English pager, and English confirmation buttons on `/my/tracks`, `/my/workouts`, `/my/gear`, and `/my/routes`. `feature-136` finished the workout week summary; localizing the workspace shell is the next step that makes the existing language switcher feel complete.

The backlog candidate covered all four pages in one pass. The survey found roughly 200 user-facing strings across 16 files, so this change takes the first reviewable slice and leaves the page bodies to follow-ups.

## What Changes

- Add two localized resource namespaces: `workspace` for workspace page copy and `common` for shared UI strings. Register both in `app/i18n/settings.ts`, `i18n.config.ts`, and the resource list in `app/layout.tsx`.
- Localize the signed-in user menu in `navbar-user-menu.tsx`: **Profile**, **My tracks**, **My routes**, **My workouts**, **My gear**, and the avatar `alt` text. The existing `dashboard` and `signout` keys stay as they are.
- Localize the visible page title of all four owner pages (`/my/tracks`, `/my/workouts`, `/my/gear`, `/my/routes`) through server-side `getT(workspaceNamespace)` so the `<h1>` follows the interface language.
- Localize the shared primitives the workspace renders: `DataTable` ("No results.", "Page X of Y", "Previous page", "Next page"), `ConfirmDialog` default "Confirm" / "Cancel", and the "Delete" label from `useDeleteRowConfirm`.
- Keep explicit component props authoritative: a caller that passes `confirmLabel` or `cancelLabel` still overrides the localized defaults.
- Ship English and Russian copy for every new key.

## Capabilities

### New Capabilities

- `workspace-localization`: the owner workspace shell, account-menu entries, page titles, and shared table/confirmation controls follow the active interface language, with English and Russian parity and safe fallback.

### Modified Capabilities

- None. The menu's destinations and access rules do not change, and no existing requirement text changes.

## Impact

- `app/i18n/settings.ts`, `i18n.config.ts`, `app/layout.tsx`: namespace registration and resource loading.
- `app/i18n/locales/{en,ru}/navigation.json`: profile, workspace menu entries, avatar alt.
- New `app/i18n/locales/{en,ru}/workspace.json`: page titles.
- New `app/i18n/locales/{en,ru}/common.json`: shared table, confirmation, and delete copy.
- `components/blog-pages/navbar-user-menu.tsx`: `t()` for the menu and avatar alt.
- `app/(public)/my/{tracks,workouts,gear,routes}/page.tsx`: server-side translated `PageLayout` title.
- `components/common/data-table.tsx`, `components/common/confirm-dialog.tsx`, `lib/use-delete-row-confirm.ts`: localized defaults.
- `openspec/backlog.md`: narrow `feature-137`, record the remaining localization slices as candidates.
- No Prisma schema change, no migration, no query, no route change, no change to auth or visibility rules. Database-backed content (track titles, gear names, route titles, activity-type names) stays untranslated.

## Non-Goals

- Localizing the body copy of `/my/gear`, `/my/routes`, `/my/tracks`, and `/my/workouts` (forms, columns, dialogs, toasts, empty states). These become separate follow-up changes.
- Localizing server-action `message` strings returned by `app/_data/gear.ts`, `app/_data/routes.ts`, and `app/_data/tracks.ts`.
- Localizing page `<metadata>` titles and descriptions. They stay English, matching the existing `/about` precedent.
- Localizing date formatting, unit formatters, timezone identifiers, enum values, and database content.
- Translating admin-only copy beyond the shared primitives this change touches.

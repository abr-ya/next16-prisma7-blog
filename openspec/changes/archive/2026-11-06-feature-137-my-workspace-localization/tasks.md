# Tasks

## 1. Namespace scaffolding

- [x] 1.1 Export `workspaceNamespace = "workspace"` and `commonNamespace = "common"` from `app/i18n/settings.ts`.
- [x] 1.2 Register both namespaces in `i18n.config.ts` (`ns`) and in the `getResources` list in `app/layout.tsx`; keep `defaultNS` as `navigation`.
- [x] 1.3 Create `app/i18n/locales/{en,ru}/workspace.json` with the four page-title keys.
- [x] 1.4 Create `app/i18n/locales/{en,ru}/common.json` with the `dataTable`, `confirmDialog`, and `actions` keys.

## 2. Account menu

- [x] 2.1 Add `profile`, `myTracks`, `myRoutes`, `myWorkouts`, `myGear`, `userAvatarAlt` (`{{name}}`), and `userAvatarAltFallback` to `app/i18n/locales/{en,ru}/navigation.json`.
- [x] 2.2 In `components/blog-pages/navbar-user-menu.tsx`, replace the five literal labels and the avatar `alt` with `t()` values; interpolation uses the user name and the fallback key when it is missing.

## 3. Page shells

- [x] 3.1 In `app/(public)/my/{tracks,workouts,gear,routes}/page.tsx`, initialize the server i18n instance and read `getT(workspaceNamespace)`; pass the translated title to `PageLayout`.
- [x] 3.2 Leave the static `metadata` objects in English, matching the `/about` precedent.

## 4. Shared primitives

- [x] 4.1 In `components/common/data-table.tsx`, translate the empty state, page summary, and previous/next accessible names through `useT(commonNamespace)`.
- [x] 4.2 In `components/common/confirm-dialog.tsx`, translate the default confirm and cancel labels; keep explicit `confirmLabel` / `cancelLabel` props authoritative and do not change the pending guard.
- [x] 4.3 In `lib/use-delete-row-confirm.ts`, translate the `Delete` confirmation label through `useT(commonNamespace)`.
- [x] 4.4 Spot-check that call sites passing their own labels still render those labels unchanged on both workspace and admin surfaces.

## 5. Backlog bookkeeping

- [x] 5.1 Narrow the `feature-137-my-workspace-localization` row in `openspec/backlog.md` to this slice and mark it `In Progress`.
- [x] 5.2 Add unnumbered follow-up candidates for the remaining slices: `/my/gear` body, `/my/routes` body, and `/my/tracks` + `/my/workouts` body.

## 6. Validation

- [x] 6.1 `npm run tsc` — expect no type errors.
- [x] 6.2 `npx eslint app/\(public\)/my components/blog-pages/navbar-user-menu.tsx components/common/data-table.tsx components/common/confirm-dialog.tsx lib/use-delete-row-confirm.ts --quiet` — expect no errors.
- [x] 6.3 `npm run lint` — expect no new errors.
- [x] 6.4 `npx openspec validate feature-137-my-workspace-localization --strict` — expect the change to validate.
- [x] 6.5 `npm run build` — run locally by the owner.

## 7. Browser check (the owner's)

- [x] 7.1 Switch EN/RU and confirm the account-menu entries, avatar alt text, and all four page titles follow the language.
- [x] 7.2 Confirm a workspace table shows the localized empty state, page summary, and previous/next names, and that a confirmation dialog and a delete-row dialog use the localized defaults.
- [x] 7.3 Confirm the same shared primitive copy appears localized on one admin table, with sorting, pagination, and confirmation behavior unchanged.
- [x] 7.4 Confirm switching language while on an owner page updates it after the existing refresh, without a second switch or manual reload.
- [x] 7.5 Confirm database-backed names (track, gear, route) stay exactly as entered, and that the Russian wording reads naturally.

# Proposal

## Why

**Four localized strings show their placeholder instead of the value they name.** The `trips` namespace carries `Distance: {distance}`, `Source: {source}`, `Timezone for {title}` and `Selected point {index}. Press Delete to remove.` — and every one of them renders exactly that, braces included, in both English and Russian.

The cause is the placeholder syntax, not the values. i18next 26.4.0 interpolates only `{{ }}`: its defaults are `prefix: "{{"` and `suffix: "}}"` (`node_modules/i18next/dist/esm/i18next.js:1736-1738`). next-i18next 16.0.11 overrides exactly one interpolation setting in each of its two instances — `escapeValue: false` on the client (`node_modules/next-i18next/dist/appRouter/client.mjs:63`) and on the server (`node_modules/next-i18next/dist/appRouter/server.mjs:102`) — and never touches the prefix or the suffix. The project's `i18n.config.ts` sets no interpolation options and passes no `i18nextOptions`. So a single brace is literal text everywhere in this app, and only a `{{ }}` pair is a placeholder.

The call sites are not at fault either. All four already pass their value — `t("trackEditorDistanceLabel", { distance: distanceLabel })` and three like it — so the value is there and the template refuses to consume it. The defect is entirely in eight template strings.

This one is worth taking now: the same file already carries the correct form twice (`quickWorkout.statsSummary`, `quickWorkout.rememberGearLabel`), so the house syntax is settled and the fix is four keys in each of two files.

## What Changes

- **The four affected keys switch to i18next's `{{ }}` placeholder syntax**, in `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`. The wording around the placeholder is unchanged — only the placeholder itself becomes a placeholder.
- **A guard script, `scripts/check-locale-placeholders.ts`,** fails when any locale file carries a single-brace placeholder, and asserts that the four keys render their value through an i18next instance configured the way next-i18next configures it.

## Non-goals

- **No change to the interpolation configuration.** `i18n.config.ts` and the `I18nProvider` in `app/layout.tsx` stay as they are: `{{ }}` remains the project's placeholder syntax and `escapeValue: false` remains next-i18next's setting. Switching the project to single braces would mean converting the two working `{{ }}` strings back, changing the placeholder syntax of every string in the app, and touching both i18n instances for a defect that eight strings caused.
- **No wider sweep.** A scan of all six locale files finds exactly four single-brace placeholders, all in `trips.json` — two in each language file, four keys each. There is nothing else to convert.
- **No component change.** The four call sites already pass their value; they stay byte-for-byte.
- **No new dependency, no schema change, no migration, no new capability.**
- **Not the shared `ConfirmDialog`'s English `Cancel` default**, and not the other hardcoded English in the admin panels. Those are separate sweeps.
- **No change to `quickWorkout.statsSummary` or `quickWorkout.rememberGearLabel`** — they already use `{{ }}` and already render correctly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks` — the place-on-map distance line, the selected point's title, and the trip linked-track source badge render their value in place of the placeholder.
- `outdoor-photos` — the trip photo timezone dialog's title renders the photo's title in place of the placeholder.

## Impact

- **Code**: `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json` (four keys each); `scripts/check-locale-placeholders.ts` (new); `scripts/README.md` (the script's entry); `openspec/backlog.md` (the bug leaves the unconfirmed-bugs table and becomes a numbered fix row).
- **Surfaces**:
  - the Place-on-map tab of the track dialog on `/admin/tracks` and `/my/tracks` — the distance line, and the title of the selected point's marker;
  - the linked-track card on the public trip page `/trips/[slug]` — the `timeSource` source badge;
  - the trip photo timezone dialog on the same page — its title.
- **Not affected**: routes, data models, database, permissions, the public/private boundary of any surface.
- **Depends on**: nothing. Independent of `fix-010` — the same namespace and file, different keys and a different defect.

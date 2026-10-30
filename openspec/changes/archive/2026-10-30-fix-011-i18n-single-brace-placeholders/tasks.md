# Tasks

## 1. Locale strings

- [x] 1.1 In `app/i18n/locales/en/trips.json`, change `trackEditorDistanceLabel` to `Distance: {{distance}}` and `trackEditorMapSelectedPointAria` to `Selected point {{index}}. Press Delete to remove.` — verify by reading the two lines back that the braces are doubled and that the rest of the wording is byte-identical.
- [x] 1.2 In the same file, change `trackTimeSourceBadgeLabel` to `Source: {{source}}` and `photoTimezoneDialogTitleWithPhoto` to `Timezone for {{title}}` — verify the same way.
- [x] 1.3 In `app/i18n/locales/ru/trips.json`, change `trackEditorDistanceLabel` to `Расстояние: {{distance}}` and `trackEditorMapSelectedPointAria` to `Выбрана точка {{index}}. Нажмите Delete, чтобы удалить.` — verify that the Russian wording is byte-identical apart from the doubled braces.
- [x] 1.4 In the same file, change `trackTimeSourceBadgeLabel` to `Источник: {{source}}` and `photoTimezoneDialogTitleWithPhoto` to `Часовой пояс: {{title}}` — verify the same way.
- [x] 1.5 Scan all six locale files for a remaining single-brace placeholder — expect none; the four keys above were the only ones.
- [x] 1.6 Confirm `quickWorkout.statsSummary` and `quickWorkout.rememberGearLabel` still use `{{ }}` and that this edit did not touch them.
- [x] 1.7 In `components/track-pages/track-editor.tsx`, use `tripsNamespace` for `useT` so the editor labels resolve from `trips.json`; leave the translation keys and interpolation arguments unchanged.

## 2. Guard script

- [x] 2.1 Add `scripts/check-locale-placeholders.ts`: a static scan over the six locale JSON files that reports any string containing a single-brace placeholder, naming the file and the key, and exits non-zero when it finds one — in the style of the existing `scripts/check-*.ts` helpers (`✓`/`✗` output, run with `npx tsx`).
- [x] 2.2 In the same script, add a runtime check: build an i18next instance with next-i18next's own interpolation settings (`escapeValue: false`, default prefix and suffix) over the `trips` resources, and assert that each of the four keys renders its value rather than the placeholder — including one value that contains an apostrophe (`Bob's photo`), which must come out unchanged and not as an escape sequence.
- [x] 2.3 Run `npx tsx scripts/check-locale-placeholders.ts` — expect every check to pass and the script to exit 0.
- [x] 2.4 Prove the guard bites: temporarily reintroduce a single-brace placeholder in one locale file, run the script, expect a non-zero exit with the offending key named, then restore the file and re-run to a pass.
- [x] 2.5 Document the script in `scripts/README.md` — what it checks, the command to run it, and when to reach for it.

## 3. Validation

- [x] 3.1 Re-run `npm run tsc` after correcting the `TrackEditor` namespace — expect no type errors.
- [x] 3.2 `npx eslint scripts/check-locale-placeholders.ts --quiet` — expect no errors.
- [x] 3.3 `npm run lint` — expect no errors.
- [x] 3.4 Re-run `npx openspec validate fix-011-i18n-single-brace-placeholders` after updating the implementation scope — expect the change to validate.
- [x] 3.5 `npx eslint components/track-pages/track-editor.tsx --quiet` — expect no errors.

## 4. Backlog bookkeeping

- [x] 4.1 In `openspec/backlog.md`, remove the `i18n-single-brace-placeholders-not-interpolated` row from the `## Unconfirmed Bugs` table — the defect is confirmed and now numbered. Done at propose time.
- [x] 4.2 In the same file, add a row to the `## Fixes` table: `| In Progress | fix-011-i18n-single-brace-placeholders | outdoor/tracks | … |`, carrying the defect, the fix, and the rejected alternative. Done at propose time.
- [x] 4.3 Flip that row's status to `Done` once the implementation is complete, before the change is archived. Done on 2026-10-30, before the change is archived.

## 5. Browser and build check (the owner's)

- [x] 5.1 With the interface in English, open the track dialog's Place-on-map tab on `/admin/tracks` or `/my/tracks`, place two points, and confirm the map heading, help text, point-list label, and distance label render as English copy; the distance line must show the measured value instead of `{distance}`, with no raw translation keys visible. Verified by the owner on 2026-10-30 in English and, in the same pass, in Russian.
- [x] 5.2 The owner runs the production build (`npm run build`) after the `TrackEditor` namespace correction and reports the result — the agent does not start the dev server or run the build. The prior build passed on 2026-10-30 before this correction. The owner reran it after the correction on 2026-10-30: the build finished with no errors (TypeScript, page-data collection, static generation and page optimization all reported success).

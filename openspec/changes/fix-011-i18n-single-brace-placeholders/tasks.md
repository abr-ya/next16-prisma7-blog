# Tasks

## 1. Locale strings

- [ ] 1.1 In `app/i18n/locales/en/trips.json`, change `trackEditorDistanceLabel` to `Distance: {{distance}}` and `trackEditorMapSelectedPointAria` to `Selected point {{index}}. Press Delete to remove.` — verify by reading the two lines back that the braces are doubled and that the rest of the wording is byte-identical.
- [ ] 1.2 In the same file, change `trackTimeSourceBadgeLabel` to `Source: {{source}}` and `photoTimezoneDialogTitleWithPhoto` to `Timezone for {{title}}` — verify the same way.
- [ ] 1.3 In `app/i18n/locales/ru/trips.json`, change `trackEditorDistanceLabel` to `Расстояние: {{distance}}` and `trackEditorMapSelectedPointAria` to `Выбрана точка {{index}}. Нажмите Delete, чтобы удалить.` — verify that the Russian wording is byte-identical apart from the doubled braces.
- [ ] 1.4 In the same file, change `trackTimeSourceBadgeLabel` to `Источник: {{source}}` and `photoTimezoneDialogTitleWithPhoto` to `Часовой пояс: {{title}}` — verify the same way.
- [ ] 1.5 Scan all six locale files for a remaining single-brace placeholder — expect none; the four keys above were the only ones.
- [ ] 1.6 Confirm `quickWorkout.statsSummary` and `quickWorkout.rememberGearLabel` still use `{{ }}` and that this edit did not touch them.

## 2. Guard script

- [ ] 2.1 Add `scripts/check-locale-placeholders.ts`: a static scan over the six locale JSON files that reports any string containing a single-brace placeholder, naming the file and the key, and exits non-zero when it finds one — in the style of the existing `scripts/check-*.ts` helpers (`✓`/`✗` output, run with `npx tsx`).
- [ ] 2.2 In the same script, add a runtime check: build an i18next instance with next-i18next's own interpolation settings (`escapeValue: false`, default prefix and suffix) over the `trips` resources, and assert that each of the four keys renders its value rather than the placeholder — including one value that contains an apostrophe (`Bob's photo`), which must come out unchanged and not as an escape sequence.
- [ ] 2.3 Run `npx tsx scripts/check-locale-placeholders.ts` — expect every check to pass and the script to exit 0.
- [ ] 2.4 Prove the guard bites: temporarily reintroduce a single-brace placeholder in one locale file, run the script, expect a non-zero exit with the offending key named, then restore the file and re-run to a pass.
- [ ] 2.5 Document the script in `scripts/README.md` — what it checks, the command to run it, and when to reach for it.

## 3. Validation

- [ ] 3.1 `npm run tsc` — expect no type errors.
- [ ] 3.2 `npx eslint scripts/check-locale-placeholders.ts --quiet` — expect no errors.
- [ ] 3.3 `npm run lint` — expect no errors.
- [ ] 3.4 `npx openspec validate fix-011-i18n-single-brace-placeholders` — expect the change to validate.

## 4. Backlog bookkeeping

- [x] 4.1 In `openspec/backlog.md`, remove the `i18n-single-brace-placeholders-not-interpolated` row from the `## Unconfirmed Bugs` table — the defect is confirmed and now numbered. Done at propose time.
- [x] 4.2 In the same file, add a row to the `## Fixes` table: `| In Progress | fix-011-i18n-single-brace-placeholders | outdoor/tracks | … |`, carrying the defect, the fix, and the rejected alternative. Done at propose time.
- [ ] 4.3 Flip that row's status to `Done` once the implementation is complete, before the change is archived.

## 5. Browser check (the owner's)

- [ ] 5.1 Open the track dialog's Place-on-map tab on `/admin/tracks` or `/my/tracks`, place two points, and confirm the distance line reads the measured distance and no `{distance}`; select a point and confirm its marker title names the point number and no `{index}`.
- [ ] 5.2 Open `/trips/[slug]` for a trip with a linked track that carries a `timeSource`, and confirm the source badge reads the localized source (e.g. `Источник: GPX`) and no `{source}`.
- [ ] 5.3 Open the timezone dialog for a trip photo and confirm its title names the photo and no `{title}`.
- [ ] 5.4 Repeat one of the three checks with the interface in English and confirm the wording is unchanged apart from the placeholder.
- [ ] 5.5 The owner runs the production build (`npm run build`) and reports the result — the agent does not start the dev server or run the build.

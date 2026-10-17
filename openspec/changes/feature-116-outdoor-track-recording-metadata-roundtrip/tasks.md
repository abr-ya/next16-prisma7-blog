# Tasks

## 1. Server-side: column write in `parseTrackGpx`

- [ ] 1.1 In `app/_data/tracks.ts`, extend the `parseTrackGpx` `prisma.track.update` payload to include `recordingStartAt: new Date(summaryTime.start)` and `recordingDurationSeconds: summaryTime.durationSeconds` when `metadataToPersist.summary?.time` is non-null, and `null` / `null` when it is `null`. Verify the change by re-reading the updated `parseTrackGpx` and confirming the new write sits next to the existing `metadata` and `timeSource: "GPX"` writes in the same `data` object.
- [ ] 1.2 Confirm the write happens on every parse (success, failed, stale) by re-reading the surrounding `metadataToPersist` ternary — the new column writes must mirror the existing `timeSource: "GPX"` re-assert and must not be gated on the success branch. Verify by re-reading the file.
- [ ] 1.3 Confirm `noUncheckedIndexedAccess` and Prisma's `Date | null` typing for `recordingStartAt` are satisfied by reading the updated file and running `npm run tsc` after task 1.1 lands.

## 2. Server-side: new `updateTrackRecordingMetadata` action

- [ ] 2.1 In `app/_data/tracks.ts`, add a new exported `updateTrackRecordingMetadata` function placed immediately after the existing `updateTrackRecordingTimezone` (~line 635). The function accepts `{ id, recordingStartAt: string | null, recordingDurationSeconds: number | null, recordingTimezone: string | null }`, runs `getRequiredUserId`, looks up the row with `where: { id, userId }` (matching the existing timezone action's pattern), runs the existing `requireTrackRecordingTimezone` helper on the supplied timezone (throws if invalid), runs `parseManualTrackStartAt` only when `recordingStartAt` and `recordingTimezone` are both non-empty (catches `TrackStartAtParseError` and re-throws as a typed validation error), runs `parseDurationInput` only when `recordingDurationSeconds` is non-null (catches `TrackDurationInputError` and re-throws), then writes a single `prisma.track.update` that sets the four columns and re-asserts `timeSource: "MANUAL"` only when at least one of the four columns is non-null. Verify by reading the file after the edit.
- [ ] 2.2 Add the revalidation block to `updateTrackRecordingMetadata` that mirrors the existing `updateTrackRecordingTimezone` block: revalidate `/tracks/[slug]` for the row's `slug`, then revalidate `/trips/[slug]` for every `HikesToTracks` association. Verify by re-reading the file and confirming the `for` loop pattern matches the existing action.
- [ ] 2.3 Run `npm run tsc` after tasks 2.1 and 2.2 land and confirm zero new TypeScript errors. Verify the tsc output shows no errors mentioning `updateTrackRecordingMetadata` or its new imports.

## 3. Form: split reset hook by `track.timeSource`

- [ ] 3.1 In `components/admin-pages/tracks-admin-panel.tsx`, branch the form reset `useEffect` (~line 260-286) on `track.timeSource`. For `track.timeSource === "MANUAL"`, populate the four optional fields from the row: `recordingStartAt` from `track.recordingStartAt?.toISOString().slice(0, 16) ?? ""`, `recordingTimezone` from `track.recordingTimezone ?? ""`, the three duration fields from the new `parseStoredDurationToHms` helper (task 4.1), and `includeSeconds` from the boolean the same helper returns. For `track.timeSource === "GPX"`, do the same pre-fill but render the four `FormField` blocks with `readOnly` on the `Input` and a localized hint paragraph from the new `trackRecordingMetadataFromFileHint` i18n key (task 5.1) underneath. For `track.timeSource === "NONE"` or `null`, keep the existing empty pre-fill and the inputs editable. Verify by re-reading the updated `useEffect` block.
- [ ] 3.2 Confirm the existing `defaultValues` shape used by the create path (the `else` branch) is unchanged so the `Place on map` create flow keeps working. Verify by re-reading the file.
- [ ] 3.3 Run `npm run tsc` after task 3.1 lands and confirm zero new TypeScript errors. Verify the tsc output shows no errors mentioning the form reset hook.

## 4. Helper: `parseStoredDurationToHms`

- [ ] 4.1 In `lib/track-duration-input.ts`, add a new exported pure helper `parseStoredDurationToHms(seconds: number | null): { hours: string; minutes: string; seconds: string; includeSeconds: boolean }` placed next to the existing `parseDurationInput`. The helper splits a non-negative integer number of seconds back into the three components the form collects: `hours = Math.floor(s / 3600)`, `minutes = Math.floor((s % 3600) / 60)`, `seconds = s % 60`. `includeSeconds` is `true` when the original seconds component is non-zero. All four returned fields are strings so they bind to the form's string-typed inputs. The helper is read-only (no side effects) and accepts `null` by returning zeros and `includeSeconds: false`. Verify by reading the file after the edit.

## 5. Localization: new "from file" hint key

- [ ] 5.1 In `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`, add a new key `trackRecordingMetadataFromFileHint` with the localized read-only "from file" hint text shown under the four inputs when `track.timeSource === "GPX"`. The English value is something like `"These values come from the uploaded GPX file and cannot be edited."`; the Russian value is the equivalent translation. Verify by reading both files after the edit and confirming the key is present in both locales.

## 6. Form: submit handler dispatches the new action for `MANUAL` rows

- [ ] 6.1 In `components/admin-pages/tracks-admin-panel.tsx`, extend the `onSubmit` handler's edit branch (~line 382) so that after the existing `updateTrack` call, it runs a follow-up block when `track.timeSource === "MANUAL"`: parse `recordingStartAt` and `recordingDurationSeconds` the same way the create path does (using `parseManualTrackStartAt` and `parseDurationInput`), catch `TrackStartAtParseError` and `TrackDurationInputError` to surface the localized toast, and call `updateTrackRecordingMetadata` with the parsed values. For `track.timeSource === "GPX"`, the follow-up block is skipped entirely. For `track.timeSource === "NONE"` or `null`, the follow-up block runs and writes the four columns but does not change `timeSource` (per design decision). Verify by re-reading the updated `onSubmit` block.
- [ ] 6.2 Confirm the existing `updateTrack` call still runs first and that the new follow-up block does not block the success toast on a no-op for `GPX` rows. Verify by reading the file.

## 7. Validation

- [ ] 7.1 Run `npm run tsc` and confirm zero TypeScript errors across the changed files. Verify the tsc output.
- [ ] 7.2 Run `npx eslint app/_data/tracks.ts components/admin-pages/tracks-admin-panel.tsx lib/track-duration-input.ts --quiet` and confirm zero warnings. Verify the eslint output.
- [ ] 7.3 Run `npm run build` and confirm `/tracks`, `/tracks/[slug]`, `/admin/tracks`, `/my/tracks`, and `/trips/[slug]` still appear in the build output. Verify the build output.
- [ ] 7.4 Manual browser smoke check on a development build for three cases:
  - (a) **Re-parse a published GPX track** with usable `<time>` elements from `/admin/tracks`, then open `/tracks/[slug]` and confirm the `Recording start` and `Recording duration` lines now render from the new columns (existing `metadata.summary.time` block stays byte-identical).
  - (b) **Edit a `MANUAL` track** on `/admin/tracks` or `/my/tracks`: open the dialog, type a new wall-clock + timezone + duration, save, re-open the dialog, confirm the typed values are pre-filled and saved to the row.
  - (c) **Edit a `GPX` track** on `/admin/tracks`: open the dialog, confirm the four inputs are read-only with the "from file" hint, attempt to type (verify the browser blocks), save, confirm the columns are unchanged.
  - Optional cross-surface check on case (a): open `/tracks`, `/admin/tracks`, and `/trips/[slug]` (linked-track card) and confirm the same `Source: GPX` badge + `Recording start` / `Recording duration` lines appear (they were absent before the re-parse, present after).
  - Remaining edge cases (legacy GPX rows that have never been reparsed after this slice, `NONE` rows where the owner populates fields and the badge stays `NONE`) deferred to a follow-up `outdoor-track-recording-metadata-roundtrip-visual-qa` candidate on the backlog.

## 8. Backlog and documentation bookkeeping

- [ ] 8.1 In `openspec/backlog.md`, add a new candidate `outdoor-track-recording-metadata-roundtrip-visual-qa` summarizing the deferred edge-case checks (legacy GPX rows that have never been reparsed, `NONE` rows where the owner populates fields, browser-level `readOnly` enforcement on the four `GPX` inputs, cross-surface consistency after a re-parse). Verify by reading the updated `backlog.md` and confirming the new candidate is appended to the `outdoor/tracks` area.
- [ ] 8.2 Append a `feature-116 | feature-116-outdoor-track-recording-metadata-roundtrip | outdoor/tracks | ...` row to the Completed Features table in `openspec/feature-history.md` summarising the `parseTrackGpx` column write, the new `updateTrackRecordingMetadata` server action, the form reset split by `timeSource`, and the read-only render of the four inputs for `GPX` rows. Verify by reading the updated file and confirming the new row sits next to the existing `feature-113` and `feature-115` rows.
- [ ] 8.3 Run `openspec validate feature-116-outdoor-track-recording-metadata-roundtrip --strict` and confirm the change is ready to archive. Verify the validate output says the change is valid.

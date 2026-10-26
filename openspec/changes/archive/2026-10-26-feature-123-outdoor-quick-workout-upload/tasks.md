# Tasks

## 1. The wording dictionary

- [x] 1.1 Add a `quickWorkout` block to `app/i18n/locales/ru/trips.json` and `app/i18n/locales/en/trips.json` with the shared dialog strings: `fileLabel`, `titleLabel`, `gearLabel`, `gearNone`, `gearEmpty`, `save`, `saving`, `success`, `error`, and a `statsSummary` line for the parsed distance, duration, and start. Verify that both files carry the same key set, the way the existing `trips.json` keys do.
  - The `statsSummary` placeholders use i18next's `{{ }}` syntax — the installed i18next interpolates only `{{ }}`, and the four pre-existing single-brace strings in the same file never interpolate at all. That pre-existing bug is filed as `i18n-single-brace-placeholders-not-interpolated` in `openspec/backlog.md`.
- [x] 1.2 Add the `activities` block to both files with the `walking` entry: `addLabel` (`Добавить прогулку` / `Add a walk`), `noun` (`прогулка` / `walk`), and the four `dayparts` — `morning`, `day`, `evening`, `night` — each holding the adjective that agrees with that noun in that language (`Утренняя` / `Morning`, `Дневная` / `Daytime`, `Вечерняя` / `Evening`, `Ночная` / `Night`). Verify that the Russian adjective agrees with `прогулка` and that the English adjective precedes the noun.
- [x] 1.3 Use the existing `addTrack*` keys for the shared outcomes (`addTrackSuccess`, `addTrackError`, `addTrackUploadError`, `addTrackQuotaReached`) rather than duplicating them. Verify that a quick upload shows the same wording the track form shows for the same failure.

## 2. The preview parse and the daypart

- [x] 2.1 In `lib/track-gpx-parser.ts`, export a lightweight `parseTrackGpxPreview(content)` that returns the recording start, the distance in meters, the duration in seconds, and the point count — or `null` when the content is not a readable GPX. It reuses the module's own point parsing and distance and time computation rather than re-implementing them, and it does not build the metadata envelope. Verify that it returns the same start and distance as `parseTrackGpxMetadata` for the same file.
- [x] 2.2 Add `getQuickWorkoutDaypart(date, utcOffsetMinutes)` to `lib/track-gpx-parser.ts` or a small `lib/quick-workout.ts`: it reads the *recording's* hours — at the file's own UTC offset when the file names one, and at the device's local time otherwise — and returns `night` (00:00–04:59), `morning` (05:00–11:59), `day` (12:00–16:59), or `evening` (17:00–22:59). Verify the four boundaries, including 04:59, 05:00, 11:59, 12:00, 16:59, 17:00, and 22:59.
- [x] 2.3 Add `buildQuickWorkoutSlugBase({ activityTypeKey, startAt, utcOffsetMinutes })` to the same module: it formats the recording's local date and time as `{key}-{yyyy-MM-dd}-{HHmm}` — `walking-2026-10-25-0830`. Verify that the output is already within the `createSlug` alphabet.

## 3. The shared upload section

- [x] 3.1 Extend `components/track-pages/track-gpx-upload-section.tsx` with an optional `onBeforeUpload?: (files: File[]) => void` prop, passed through to the dropzone's `onBeforeUploadBegin`. The prop is optional and the two existing consumers (`TrackFormDialog`, the trip-side `hike-track-contribution-form`) pass nothing and behave exactly as before. Verify that the existing dialogs still upload and report completion unchanged.
- [x] 3.2 Verify the raw file really reaches the caller: the handler receives the `File` before the upload starts, and the upload itself is unaffected by the handler's return value.

## 4. The server action (`app/_data/tracks.ts`)

- [x] 4.1 Add `createQuickWorkout({ fileAssetId, activityTypeId, title, slug, gearId })` to `app/_data/tracks.ts`, returning the `createManualTrack` result shape: `{ ok: true, trackId, trackSlug }` or `{ ok: false, code, message }` with the codes `TRUST`, `QUOTA`, `SLUG`, `VALIDATION`, `INTERNAL`. It resolves the owner through `requireTrustGatedAction("track-upload")`, exactly as `createTrack` does. Verify that an ineligible caller gets `{ ok: false, code: "TRUST" }` and no track.
- [x] 4.2 Guard the file asset with the existing `ensureEligibleTrackFileAsset({ fileAssetId, userId })` and the gear with the existing `ensureEligibleTrackGear` from `feature-122` — the gear is optional, and a gear that is not the owner's or does not fit the activity type is refused with `VALIDATION`. Verify that a file asset owned by somebody else creates no track.
- [x] 4.3 Validate the activity type with `getTrackActivityTypeById` — an unknown or inactive type is refused with `VALIDATION`. Validate the title: a title that is empty after trimming is refused. Verify both.
- [x] 4.4 Add a module-private `ensureUniqueTrackSlug(base)`: it runs `createSlug` over the proposed slug, then appends `-2`, `-3`, … until `prisma.track.findUnique({ where: { slug } })` finds nothing, with a bounded number of attempts. Verify that two quick uploads of the same activity type in the same minute produce two tracks with different slugs and that neither save is refused.
- [x] 4.5 Fetch and parse the file before the write: reuse `fetchTrackGpxContent` and `parseTrackGpxMetadata` exactly as `parseTrackGpx` does, derive the mirrored `recordingStartAt` and `recordingDurationSeconds` from the parsed summary, and write the metadata with the row in one `prisma.track.create` inside `createWithinVerifiedResourceQuota(user, "track", …)`. The row carries `kind: "TRAINING"`, `status: "DRAFT"`, `activityTypeId`, `gearId`, `timeSource: "GPX"`, and the file's own UTC offset as its `recordingTimezone` (see section 7). Verify that the created track has the parsed distance and the recording start right after the save.
- [x] 4.6 When the file cannot be read from storage, create the track with the stale-metadata state instead of failing the save, and let the owner re-parse it from the track form. Verify that the save still succeeds and that the track form offers the re-parse.
- [x] 4.7 Revalidate the owner track paths after the write (`revalidateTrackPaths()` and `/my/workouts`) so both the workouts list and the tracks list show the new row. Verify that the new workout appears on `My workouts` right after the save.

## 5. The dialog

- [x] 5.1 Create `components/track-pages/quick-workout-upload-dialog.tsx` as a client component taking the activity type (`id` and `key`), the owner's gear, and the open state. It renders the shared `Dialog` primitives from `@/components/index`, the shared `TrackGpxUploadSection`, a title `Input`, and the gear `Select` — nothing else. Verify that the dialog shows exactly three controls.
- [x] 5.2 Parse the dropped file in the browser through the new `onBeforeUpload` prop: read the file as text, call `parseTrackGpxPreview`, and on a successful parse fill the title with `<daypart adjective> <noun>` from the dictionary and show the distance, the duration, and the recording start in the stats line. The start is shown in the recording's own offset when the file names one (see section 7). Verify that dropping a GPX recorded in the morning fills the title with the morning wording.
- [x] 5.3 When the file carries no usable timestamps, fill the title with the dictionary's bare noun (`Прогулка` / `Walk`) instead of a daypart title. Verify that a GPX without `<time>` elements produces that title and that the parse reports no start.
- [x] 5.4 Keep the title editable: the owner may replace the suggestion, and the typed value is what is sent. Verify that a typed title survives the save and appears on the track.
- [x] 5.5 Show the gear select with the owner's gear that fits the activity type plus a "no shoes" option; hide the control entirely when the owner has no compatible gear. Verify that a gear item that does not fit the activity type is not offered.
- [x] 5.6 Use `useDiscardGuardedTrackForm` for the close path: closing the dialog with an uploaded-but-unsaved file asks for confirmation and marks that file for deletion. Verify that a confirmed close leaves no unsaved file behind and that a cancelled close keeps the dialog open.
- [x] 5.7 On save, call `createQuickWorkout`, show the success toast and close the dialog on `ok: true`, and show the returned message in a toast on `ok: false` — the trust and quota refusals included. Verify that the dialog stays open with the file still attached when the save is refused.

## 6. The button and the page

- [x] 6.1 In `components/admin-pages/tracks-admin-panel.tsx`, add a `quickWorkoutUpload?: boolean` prop to `TrackManagementPanel`. When it is set, the panel renders one quick-add button per active activity type whose key has a wording entry in the current locale, labelled with that entry's `addLabel`, and opens the quick dialog with that activity type. Verify that `My workouts` shows `Добавить прогулку` and that `/my/tracks` and `/admin/tracks` show no such button.
- [x] 6.2 The button's icon is the lucide `Plus`, matching the existing `Add track` button in the same toolbar. Verify the toolbar reads as one row of owner actions.
- [x] 6.3 In `app/(public)/my/workouts/page.tsx`, pass `quickWorkoutUpload` and the owner's gear to the panel. The gear list is the same owner-scoped list `feature-122` already puts on that page — the quick dialog must not receive gear from anywhere else. Verify that the dialog offers only the owner's own gear.
The keyboard-reachability check is a browser check — the agent cannot press the keys. It rides along with the browser checks of section 10 in the candidate `outdoor-quick-workout-upload-manual-qa` in `openspec/backlog.md` (task 11.2) and is not a task of this change anymore:

- Verify that the quick dialog is reachable with the keyboard and that the file input, the title, and the gear select are reachable in order.

## 7. The recording timezone

- [x] 7.1 In `lib/track-gpx-parser.ts`, keep the UTC offset the file's own `<time>` values carry: `readGpxUtcOffsetMinutes(value)` reads the offset off one timestamp, `parseGpxPoints` captures it per point, and `parseTrackGpxUtcOffsetMinutes(content)` returns the first offset the file names. The normalized instant stays UTC — the offset is the recording's own wall-clock, and it was the one thing the parser threw away. Verify that a file written in Moscow (`+03:00`) yields `180`, a `Z` file yields `0`, and a file with naive timestamps yields `null`.
- [x] 7.2 In `lib/track-recording-timezone.ts`, accept a fixed offset as a recording timezone: `normalizeTrackRecordingTimezone` reads `+03:00`, `+0300` and `UTC+03:00` and canonicalises them to `+03:00`; `formatFixedUtcOffset` renders the canonical form; `formatTrackRecordingTimezone` shows `UTC+03:00`; `toRecordingTimezoneFromUtcOffset` maps an offset to the stored value (`0` → `UTC`). Verify that `Intl.DateTimeFormat` accepts the canonical form and that every IANA zone still round-trips.
- [x] 7.3 In `app/_data/tracks.ts`, `createQuickWorkout` stores the file's own offset as the row's `recordingTimezone` — a Moscow recording is stored as `+03:00`, and a file that names no offset keeps the unset timezone and the "unconfirmed" badge. Verify that the row's `recordingTimezone` is the file's offset and that `recordingStartAt` is unchanged.
- [x] 7.4 In `app/_data/tracks.ts`, `parseTrackGpx` stores the file's own offset the same way for the ordinary upload path — but only for a row that has no confirmed timezone of its own, and never for a `MANUAL` row. The offset is a starting point, not a decision: the owner's confirmed zone wins over the file's. Verify that a re-parse of a row whose owner confirmed `Europe/Moscow` keeps `Europe/Moscow`.
- [x] 7.5 In `components/track-pages/quick-workout-upload-dialog.tsx`, the preview reads the start in the file's offset rather than the device's zone, and the suggested title and the slug base read the file's own wall-clock. The device's zone stays the fallback for a file that names no offset — there it is the only reference there is. Verify that a Moscow recording previews as its Moscow time on a device in another zone.
- [x] 7.6 In `components/admin-pages/tracks-admin-panel.tsx`, the recording-timezone field is editable on a `GPX` row and the submit dispatches `updateTrackRecordingTimezone` for it; the recording start and the recording duration stay read-only, because they are the file's own values. `updateTrackRecordingTimezone` accepts a cleared field, so an emptied timezone returns the row to the "unconfirmed" state. Verify that a wrong stored zone can be corrected from the edit form.
- [x] 7.7 In `components/admin-pages/tracks-admin-panel.tsx`, the "Set recording timezone" action no longer pre-fills the field with the browser's zone — that value was saved as the track's zone by a single click, and the owner could not tell it was a guess. The browser's zone is now a suggestion the owner applies deliberately, and the field starts empty when the track carries no timezone. Verify that the action opens empty for a track without a timezone.
- [x] 7.8 In `lib/track-recording-timezone.ts`, add `resolveQuickWorkoutRecordingTimezone(utcOffsetMinutes, deviceTimezone)`: the file's own offset wins, and a file that names none falls back to the device's timezone — validated the way every recording timezone is, and dropped rather than stored when the device names an unsupported zone. Verify that `+03:00` wins over `Europe/Sofia`, that a nameless offset takes `Europe/Sofia`, and that `Not/A-Timezone` yields no timezone at all.
- [x] 7.9 In `app/_data/tracks.ts`, `createQuickWorkout` stores the resolved timezone, and `components/track-pages/quick-workout-upload-dialog.tsx` passes the device's own timezone with the save. The device's zone is a starting point, not a decision — the owner still corrects it in the track form, where the field stays editable for a `GPX` row (task 7.6). Verify that a quick upload of a file without an offset saves the device's zone, and that the value can be changed afterwards.

## 8. The workouts table columns

- [x] 8.1 In `components/admin-pages/tracks-workout-columns.tsx`, add a `Timezone` column to the short owner-side table: the confirmed recording timezone as a badge, the explicit UTC fallback with the unconfirmed marker for a workout that carries none. It sits next to the start column, which renders the start in that same timezone. Verify that a Moscow recording reads `UTC+03:00` in the list and that a row without a timezone reads `UTC (unconfirmed)`.
- [x] 8.2 In the same factory, add a `Duration` column: the mirrored `recordingDurationSeconds` when the row carries one, and the parsed summary's duration for a row parsed before that column existed. A row with no duration at all reads empty rather than as a zero. Verify that a quick upload of a 30-minute recording reads `30 min` in the list.

## 9. Validate

- [x] 9.1 `npm run tsc` — passes clean.
- [x] 9.2 `npx eslint lib/track-gpx-parser.ts lib/quick-workout.ts lib/track-recording-timezone.ts components/track-pages/quick-workout-upload-dialog.tsx components/track-pages/track-gpx-upload-section.tsx components/admin-pages/tracks-admin-panel.tsx components/admin-pages/tracks-workout-columns.tsx app/_data/tracks.ts "app/(public)/my/workouts/page.tsx" --quiet` — clean.
- [x] 9.3 `npm run lint` — clean.
- [x] 9.4 `npx openspec validate feature-123-outdoor-quick-workout-upload` — valid.
- [x] 9.5 `npm run build` — the owner ran the build on 2026-10-26 and it passed.

## 10. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as the candidate `outdoor-quick-workout-upload-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 11.2 — and are not tasks of this change anymore:

- `/my/workouts`: click `Добавить прогулку`, drop a GPX recorded in the morning, and confirm that the title is filled with the morning wording and that the distance and duration appear while the upload runs.
- Save and confirm that the workout appears in the list, that its activity type is walking, that its kind is a workout, that its status is a draft, and that the recorded start and duration match the file.
- Drop the same file twice and confirm that both saves succeed with different slugs.
- Close the dialog with an uploaded file and confirm that the discard confirmation appears and that the file is marked for deletion.
- Choose a pair of shoes and confirm that the saved workout carries the attachment, and that a second quick upload preselects nothing yet — the preselection is `feature-124`.

## 11. Docs

- [x] 11.1 `openspec/backlog.md`: the `outdoor-quick-workout-upload` candidate row becomes the `In Progress` row `feature-123-outdoor-quick-workout-upload` at promotion time (done when this change was created).
- [x] 11.2 The manual browser checks that could not be run are filed as a candidate in `openspec/backlog.md` rather than left open here.
  - Filed as `outdoor-quick-workout-upload-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md` on 2026-10-26; it carries the deferred checks of sections 6.4 and 9.

## Not in this change

- Preselecting the owner's preferred shoes — `feature-124-outdoor-gear-preferred-per-activity`.
- Publishing the workout from the dialog — the quick upload creates a draft.
- A `Добавить пробежку` button — one more wording entry, once the wording is agreed.
- A quick upload for routes, a batch import, or any public entry point.
- A recording-timezone, description, or status field in the dialog — the file's own offset is the recording timezone, and the owner corrects it in the track form.

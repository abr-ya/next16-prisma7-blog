# Design

## Context

See `proposal.md` for the motivation. The pieces this change assembles already exist, and each of them is reusable as it is:

- **`trackGpxUploader`** (`app/api/uploadthing/core.ts:118`) — 16 MB, one file, GPX name and type validated, `TRACK_GPX` purpose, `PRIVATE` visibility, returns `{ fileAssetId }`.
- **`TrackGpxUploadSection`** (`components/track-pages/track-gpx-upload-section.tsx`) — the shared dropzone, used by the admin track form and by the trip-side dialog. It reports `{ fileAssetId, fileName }` on completion and its errors.
- **`lib/track-gpx-parser.ts`** — a pure string parser. `parseTrackGpxMetadata` (`:331`) returns the metadata envelope; it imports nothing server-only (`lib/track-gpx-metadata.ts` pulls in the Prisma types with `import type` only, and `lib/track-recording-timezone.ts` has no imports at all), so it runs in the browser unchanged.
- **`createManualTrack`** (`app/_data/tracks.ts:1034`) — the model for a track-creation action that answers with a typed result: `{ ok: true, trackId, trackSlug }` or `{ ok: false, code: "TRUST" | "QUOTA" | "SLUG" | "VALIDATION" | "INTERNAL", message }`.
- **`useDiscardGuardedTrackForm`** (`lib/use-discard-guarded-track-form.ts`) — the shared guard that asks before a dirty dialog is closed and marks the unsaved uploaded GPX for deletion.

Two constraints shape the work:

1. **The activity-type dictionary is admin-managed and its wording is not a title.** `TrackActivityType` carries `key` / `nameEn` / `nameRu`; the seeded types are `walking`, `running`, `cycling`, `skiing`, `rowing`, `other`. "Walking" in Russian is `Ходьба` — a *category* label, not the noun a title wants (`прогулка`). The wording of the button and of the suggested titles is therefore a separate, per-activity-type dictionary, not the activity type's name.
2. **The project has a live migration-checksum drift.** `npx prisma migrate dev` refuses to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. This change adds no migration at all, so the drift does not touch it — but it must not be "fixed" by a reset along the way.

## Goals / Non-Goals

**Goals:**

- One click, one modal, one file, one save — and a saved workout with every derived fact already filled in.
- A dialog that is *parameterized* by activity type, so the second button is a dictionary entry and a prop, not a second component.
- A suggested title that comes from the file, is correct in the owner's own language, and can be overridden.
- No new server round trip between "the file is picked" and "the title is filled in".

**Non-Goals:**

- Editing, publishing, or any other field the dialog does not show.
- A recording-timezone input in the dialog, or any other derived field the owner has to confirm there — the file's own offset is the recording timezone, and the owner corrects it in the track form.
- Remembering the shoes (that is `feature-124`).
- A public entry point, a batch import, or a second upload route.
- Changing the shared upload route or the shared track form's fields. The shared parser gains the file's UTC offset as an additive field; nothing it already produced changes.

## Decisions

### 1. A separate dialog, not a third tab in the shared track form

**Decision:** a new client component, `components/track-pages/quick-workout-upload-dialog.tsx`, with its own form, its own payload, and its own action.

**Why:** the shared `TrackFormDialog` is the *complete* surface — title, slug, description, status, kind, activity type, recording timezone, recording start, recording duration, the two tabs. The quick dialog's entire promise is that those fields are absent. Adding it as a tab would drag the full schema, the full defaults, and the full payload into the quick flow, and every field would have to be suppressed one by one.

**What is still shared:** the upload route, the dropzone component, the discard guard, the file-asset guard, the quota, and the trust gate. Only the surface is new.

**Alternative considered:** a "quick mode" flag inside `TrackFormDialog` that hides most of the fields. Rejected — one component with two modes carries both modes' state, and the two modes' payloads differ enough (the quick flow has no slug field and no status) that the shared form would grow conditionals in every branch.

### 2. The button set comes from the wording dictionary

**Decision:** an activity type gets a quick-add button when the current locale has a wording entry for its key. The first entry is `walking` — `Добавить прогулку` / `Add a walk`.

**Why:** the owner asked for the button to be bound to an activity type so that `Добавить пробежку` can exist later with a minimal difference. A dictionary entry *is* that minimal difference: the wording of the button and of the four suggested titles, per activity type, per locale. No component changes, no new action, no new route.

**Why not "every active activity type gets a button":** a type the dictionary has no wording for would need a fallback, and the fallback would either be the generic `Добавить тренировку` (which then offers a walk-shaped dialog for a rowing type) or a wrong noun. Having no button until the wording exists is honest, and it keeps the owner's page to the one button they asked for.

**How the client checks:** `i18n.exists("quickWorkout.activities.<key>.addLabel")` per active activity type — the next-i18next way to ask whether a key is present in the current locale.

### 3. The title is suggested in the browser, from the file, before the upload finishes

**Decision:** the dialog reads the dropped `File` in the browser, parses it with the existing GPX parser, and derives the recording start, the distance, and the duration from it. The title field is filled from the recording start; the stats are shown next to the file.

**Why:** the parser is isomorphic and pure, so the browser can do exactly what the server does — no preview endpoint, no second download of the file from storage, and the suggestion appears while the upload is still in flight. The owner's ideal flow — "загрузил трек — данные подтянулись" — is satisfied at the moment the file lands, not after a round trip.

**Why the raw `File` is available:** the dropzone's `onBeforeUploadBegin` hands the caller the files before they are uploaded. `components/common/photo-upload-dialog.tsx:155` already uses it. `TrackGpxUploadSection` does not expose it yet, so it gains one optional prop (`onBeforeUpload`) that it passes through; the two existing consumers are unaffected.

**What the server does with the same file:** it re-parses it on save, and the stored metadata comes from that parse. The browser's parse is a preview and a title suggestion — never a source of stored data.

### 4. The daypart is a bucket in code and an adjective in the dictionary

**Decision:** the code knows four buckets — `night` (00:00–04:59), `morning` (05:00–11:59), `day` (12:00–16:59), `evening` (17:00–22:59) — and the dictionary holds, per activity type and locale, the noun and the four adjectives that go with it. The suggested title is `<adjective> <noun>`.

**Why the adjective lives in the dictionary and not in the code:** Russian adjective–noun agreement is not derivable from a noun. `прогулка` takes `утренняя`, `лыжи` take `утренние`, `гребля` takes `утренняя`, `велосипед` takes `утренний`. A code-side rule would have to guess a gender for every noun in the dictionary, and it would guess wrong for the ones nobody anticipated. The translator picks the adjective that agrees with the noun they wrote; the code only decides *when* it is used.

**Why the code holds the buckets:** the boundaries are a rule, not a wording — the same four moments of the day in every language.

**Why the noun is separate from the activity type's name:** `Ходьба` is the category label the owner sees in the track form; `прогулка` is the word a title wants. One dictionary entry carries the button label and the title wording together, so they cannot drift apart.

### 5. The daypart is read at the recording's own offset, not at the viewer's

**Decision:** the recording start is turned into a daypart with the hours it had where it was recorded — at the UTC offset the file's own timestamps carry, and at the browser's local time only when the file names no offset.

**Why:** the file says `+03:00` in every `<time>` of a Moscow recording. That offset is the recording's wall-clock, and it is the only place it survives: the normalized instants are UTC. Reading them on a device in Sofia shifts the recording by the difference between the two zones, and a night recording becomes an evening one. The device clock is the right reference only for a file that names no offset — there, and only there, the device's clock *is* the file's clock.

**The case it still gets wrong:** a file whose timestamps are naive and that was recorded on a device in another zone than the one uploading it. The title then names the wrong moment of the day. The risk is bounded — a title is a label the owner can retype, and the stored recording start is the file's own absolute instant either way.

### 6. A file without timestamps gets the bare noun, not a guessed time

**Decision:** when the GPX carries no usable `<time>` elements, the suggested title is the dictionary's noun alone (`Прогулка` / `Walk`), not a daypart title.

**Why:** the title would otherwise claim a time the file does not contain. The fallback is still a usable name, and the owner can type anything they like. The track's own `timeSource` stays `GPX` and its recording columns stay empty, exactly as a GPX without a timeline behaves today.

### 7. The client proposes the slug; the server makes it unique

**Decision:** the dialog proposes `{activity-type-key}-{recording-date}-{recording-start-time}` at the recording's own offset — `walking-2026-10-25-0830` — and the server sanitizes it with the existing `createSlug` and appends `-2`, `-3`, … until it is free.

**Why the format:** it is the format the backlog already proposes for the GPX-derived slug suggestion (`outdoor-track-gpx-derived-slug-suggestion`), and it is what makes repeated walks safe. A title-derived slug (`utrennyaya-progulka`) collides the second time the owner walks in the morning, and a collision in the quick flow is a dead end — there is no slug field to fix. A date and a time do not collide.

**Why the client proposes it:** the date and the time are the recording's own, and the slug is the one place they are written down. The server deriving them would have to guess a timezone it does not have. The server does not trust the text: `createSlug` reduces it to `[a-z0-9-]`, and the uniqueness loop is server-side.

**Why the server uniquifies instead of refusing:** the existing form can refuse a slug conflict, because the owner can retype the slug. The quick dialog has no slug field, so a refusal would be a dead end. The server's loop makes the save succeed and the slug readable (`walking-2026-10-25-0830-2`).

**Why not reuse `ensureSlugAvailable`:** it throws on a collision. The quick flow needs the opposite: take the next free slug.

### 8. The server parses once, before the create, and writes the metadata with it

**Decision:** `createQuickWorkout` fetches the file's content, parses it, and writes the track with the metadata and the mirrored recording columns in the same write.

**Why:** the recording start is part of the record the quick flow promises, so the parse is not optional — it is one of the things being saved. `createManualTrack` creates the track and then calls `parseTrackGpx` after the commit (`app/_data/tracks.ts:1205`), which leaves a window where the track has no metadata and fetches the file a second time. Here the create needs the parse anyway, so the metadata is written with the row and the file is fetched once.

**Why the server's parse is the authoritative one:** the browser's parse produced a *suggestion*. The stored distance, duration, and recording start come from the server's parse of the same bytes, so the record does not depend on what the browser did with them.

**The consequence:** a file that cannot be read from storage still creates the track — with the same "stale metadata" outcome `parseTrackGpx` produces — rather than failing the save. The owner can re-parse from the track form.

### 9. The status is `DRAFT`, the kind is `TRAINING`, and the recording timezone comes from the file

**Decision:** the quick upload writes `status: "DRAFT"`, `kind: "TRAINING"`, `activityTypeId` from the button, `timeSource: "GPX"`, and the file's own UTC offset as its `recordingTimezone` — `+03:00` for a recording made in Moscow, and nothing at all for a file that names no offset.

**Why `DRAFT`:** it is the default of every other track creation path, and a walk recorded seconds ago is not something to publish without a look. The owner publishes from the track form, where the activity type, the description, and the thumbnail can still be adjusted.

**Why `TRAINING`:** the button lives on `My workouts`, and the kind is what that page lists. A route created through a workout button would be a misfiling.

**Why the recording timezone comes from the file:** the offset in a GPX timestamp is not a guess — it is the recording's own wall-clock, written by the device that made the recording. `feature-112` made the timezone an owner-confirmed value because *no field can be confirmed by a machine*; but the offset is the one recording fact the file does carry, and throwing it away is what made a Moscow walk render in UTC and, once the owner "corrected" it, in the browser's zone. The offset is stored as a starting point, not as a decision: the owner can replace it with a named zone, and the surfaces show it as `UTC+03:00` so it is never mistaken for a confirmed IANA zone.

**Why an offset and not a zone:** the file names `+03:00`, not `Europe/Moscow`. A fixed offset is the truth the file carries; a named zone would add a DST rule the file never mentioned. The timezone vocabulary therefore accepts the fixed-offset form, and `Intl` reads it directly.

### 10. The action answers with the `createManualTrack` result shape

**Decision:** `createQuickWorkout` returns `{ ok: true, trackId, trackSlug }` or `{ ok: false, code, message }` with the codes `TRUST`, `QUOTA`, `SLUG`, `VALIDATION`, `INTERNAL`.

**Why:** the dialog has to say *why* a save failed. "Your account level does not allow uploading tracks" and "you have reached your verified track limit" are two different facts the owner can act on, and a thrown error shows both as a generic failure. `createManualTrack` already established the shape, the codes, and the way the trust and quota errors are caught — the quick flow reuses them rather than inventing a third.

**Why the refusal lands on the save and not on the button:** the button stays visible and the dialog stays open, with the reason in the dialog — the same shape the Place-on-map flow uses. The owner learns why when they try, not by a control that mysteriously does nothing.

### 11. The gear is optional, filtered by compatibility, and re-checked on the server

**Decision:** the dialog offers the owner's own gear that fits the button's activity type, plus a "no shoes" option; the choice is optional and the server re-checks it through `ensureEligibleTrackGear`.

**Why optional:** the owner may have no gear for that activity type yet, and a quick flow that blocks on an optional field is not quick. The dialog hides the control entirely when the owner has no compatible gear at all.

**Why filtered:** the compatibility rule from `feature-122` is invisible otherwise. The list simply holds the shoes that fit this activity type.

### 12. An unsaved upload is marked for deletion, exactly like every other GPX form

**Decision:** the dialog uses `useDiscardGuardedTrackForm`, so closing it with an uploaded-but-unsaved file asks first and then marks that file for deletion.

**Why:** the file is uploaded to storage before the track exists. Without the guard, every abandoned quick upload leaves an orphaned GPX in the owner's storage and in the `FileAsset` table. The guard is shared, so the behaviour and the wording are the same as in the track form and on the trip page.

### 13. The dialog is one component, parameterized by the activity type

**Decision:** the component takes the activity type (id and key) and renders the button-specific wording from the dictionary. The second button is the same component with a different prop.

**Why:** the owner asked for exactly this — a modal "с параметром", so that `Добавить пробежку` later costs a dictionary entry and a button, not a component. The differences between two activity types are the wording and the activity type id; everything else — the file, the title, the shoes, the save — is identical.

### 14. The recording timezone is the one recording field the owner owns, and the browser's zone is never stored by accident

**Decision:** three things change in the track workspace. The recording-timezone field stays editable on a `GPX` row (the recording start and the recording duration stay read-only — they are the file's own values), and saving the row writes the typed timezone through the existing `updateTrackRecordingTimezone` action. The focused `Set recording timezone` action no longer pre-fills the field with the browser's zone; that zone became a suggestion the owner applies on purpose. And a cleared field clears the track's timezone, which puts the row back into the explicit "unconfirmed" state.

**Why:** the owner's complaint that started this section was that a recording made in Moscow came back as `Europe/Sofia` and could not be changed. Both halves were the browser's zone leaking into stored data: the action pre-filled it, and a single click saved it. The field then could not be corrected, because the edit form renders the four recording inputs read-only for a `GPX` row — a rule written when a GPX file was the only source of the recording facts. It no longer is: the file names an *offset*, and the owner names the *zone*.

**Why the offset is not simply accepted as final:** `+03:00` is a fact about the recording, and `Europe/Moscow` is a fact about the place — the first is right even for a recording made in a place that observes DST, the second is what a reader expects to see. The owner may keep either. What must not happen is a value nobody chose.

**Why the browser's zone is a button and not a default:** a default is invisible. A field that opens already filled with `Europe/Sofia` reads as a value that was read from the track, and saving it writes the browser's guess into the record. An empty field with a labelled suggestion asks the question the owner has to answer.

## Risks / Trade-offs

- **[The title can name the wrong part of the day for a file with naive timestamps]** → The title reads the device's own clock for such a file, because the file carries no offset and the device is the only reference left. The owner can retype it, and the stored recording start is always the file's own instant. The risk is the reason the recording timezone stays an owner-corrected field (decisions 5 and 14).
- **[A fixed offset is not a named zone]** → A track stored as `+03:00` renders correctly but reads less familiar than `Europe/Moscow`. The surfaces show `UTC+03:00`, so it is never mistaken for a confirmed named zone, and the owner can replace it with one from the track form.
- **[The browser's parse and the server's parse can disagree]** → The browser's parse only produces a suggestion; the server's parse produces the stored metadata. If the server cannot read the file from storage, the track is created with the stale-metadata state and can be re-parsed from the track form — the same outcome the Place-on-map flow has.
- **[The GPX parser now ships to the browser]** → The parser is pure string code with no dependencies; it adds a few kilobytes to the client bundle. Mitigation: it is imported by the one dialog that needs it, and the same code path already runs on the server, so there is one implementation of the parsing rules rather than two.
- **[The slug is proposed by the client]** → It is sanitized by `createSlug` and uniquified by the server, so the client can only choose the readable part of it. The stored slug is always ASCII, always unique, and always server-checked.
- **[The trust and quota refusal arrives only on save]** → The owner loses the file's place in the dialog? No — the dialog stays open with the file still attached, and the message says what to do. This matches the Place-on-map flow.
- **[The quick upload creates a draft]** → A walk is not published the moment it is recorded; the owner publishes it from the track form. A future "publish immediately" toggle is a separate decision, not a default.
- **[The wording dictionary grows with every activity type]** → One block per activity type per locale. It is the price of not guessing a noun's gender in code, and it is the mechanism that makes the next button free.

## Migration Plan

None. This change adds no column, no table, and no index — it writes the columns that already exist. The migration-checksum drift on `20261013211113_feature_112_outdoor_track_creation_public_metadata` is untouched by it; the rule against a database reset still stands for any work that runs alongside it.

## Open Questions

None. The deferred questions — which pair of shoes is preselected next time (`feature-124`), and whether the quick flow ever publishes directly — belong to the later slices and change neither this design nor this task breakdown.

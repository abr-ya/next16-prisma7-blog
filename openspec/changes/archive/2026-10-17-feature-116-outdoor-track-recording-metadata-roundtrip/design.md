# Design

## Context

Feature-112 shipped the schema columns (`Track.recordingStartAt`, `Track.recordingDurationSeconds`, `Track.timeSource`) and the `Place on map` editor-side form fields. Feature-113 then exposed the columns on the four display surfaces (`/tracks/[slug]`, `/tracks`, `/admin/tracks`, the published-trip linked-track card in `components/hike-pages/hike-trip-media.tsx`). The data path is still half-open: `parseTrackGpx` populates `Track.metadata.summary.time` but never writes the new columns, and the admin / owner edit dialog (`tracks-admin-panel.tsx`) hard-resets `recordingStartAt` / `recordingDurationSeconds` to `""` / `"0"` on every open and the submit path never reads them. The fix is a one-way write in `parseTrackGpx`, a new `updateTrackRecordingMetadata` server action parallel to the existing `updateTrackRecordingTimezone`, and a small split in the form reset hook. No schema migration. No display-surface change.

## Goals / Non-Goals

**Goals:**
- Make every `Track` row end up with consistent `recordingStartAt` and `recordingDurationSeconds` values — editable on the form for `MANUAL` rows, derived-but-persisted for `GPX` rows — so a single read path serves every display surface.
- Avoid changing the public/admin rendering code. The four display surfaces already read `Track.recordingStartAt` / `Track.recordingDurationSeconds` / `Track.timeSource` after feature-113; the new content lands automatically when the parse write populates the columns.
- Preserve the existing GPX `metadata.summary.time` block as the authoritative source for the parsed values; the new columns are a column-level mirror of that summary for `GPX` rows.
- Preserve the existing `parseTrackGpx` write semantics for `timeSource: "GPX"` (every parse, success or failed, re-asserts the value).

**Non-Goals:**
- No new schema columns, no migration, no enum changes.
- No new public-facing affordance. Owners and administrators can already reach the edit dialog from `/admin/tracks` and `/my/tracks`; this change just makes that dialog load and save the saved values.
- No separate "edit recording metadata on a GPX track" affordance. The values land through the existing parse path; there is no way for a user to type them by hand.
- No changes to the existing `recordingTimezone` selection action (`updateTrackRecordingTimezone`) or to the existing four display surfaces.
- No changes to the `Place on map` create flow. feature-112 already persists `recordingStartAt` / `recordingDurationSeconds` correctly through `createManualTrack`; this slice does not touch that path.

## Decisions

### Decision: Mirror `metadata.summary.time` into the new columns in `parseTrackGpx` (no recomputation)

`TrackGpxTimeSummary` (in `lib/track-gpx-metadata.ts`) already exposes `start: string` (absolute ISO instant) and `durationSeconds: number`. The parser has already done the work of reducing the trackpoint timestamps to those two values; the column write is a straight mirror:

```ts
const summaryTime = metadataToPersist.summary?.time ?? null;
const parsedRecordingStartAt = summaryTime ? new Date(summaryTime.start) : null;
const parsedRecordingDurationSeconds = summaryTime ? summaryTime.durationSeconds : null;

await prisma.track.update({
  where: { id: track.id },
  data: {
    metadata: metadataToPersist as Prisma.InputJsonValue,
    timeSource: "GPX",
    recordingStartAt: parsedRecordingStartAt,
    recordingDurationSeconds: parsedRecordingDurationSeconds,
  },
});
```

The write is unconditional on every parse (success, failed, stale), matching the existing `timeSource: "GPX"` re-assert. When `summary.time` is `null` (no `<time>` elements, or the parse failed before reaching the time stage), both columns are set to `null` — the existing recording-time "unavailable" fallback still applies.

**Alternatives considered:**
- *Recompute `durationSeconds` via Haversine over timed trackpoints* — rejected. The parser already returns `summary.time.durationSeconds`; recomputing would diverge from the parsed block and the two surfaces would show different numbers for the same track.
- *Only write on a successful parse, leave failed parses with the previous values* — rejected. Re-asserting on every parse mirrors the existing `timeSource: "GPX"` write and means an admin who reparses a track that lost its timestamps gets a clean null, not a stale value from a previous successful parse.
- *Compute `recordingStartAt` lazily on the display path* — rejected. The four surfaces already read the columns after feature-113; a lazy path would re-introduce the read-path special case this change is closing.

### Decision: One new server action `updateTrackRecordingMetadata` instead of four small actions

The edit form already has all four values bundled into a single submit handler block. A single server action that writes all four columns in one `prisma.track.update` is the minimum diff and matches the shape the form already collects. The action accepts `{ id, recordingStartAt: string | null, recordingDurationSeconds: number | null, recordingTimezone: string | null }`:

- `recordingStartAt` arrives as a wall-clock string in the saved timezone, validated by the existing `parseManualTrackStartAt` helper (returns `Date` or throws `TrackStartAtParseError`).
- `recordingDurationSeconds` arrives as a non-negative integer, validated by the existing `parseDurationInput` helper (returns `number` or throws `TrackDurationInputError`).
- `recordingTimezone` arrives as an IANA name, validated by the existing `requireTrackRecordingTimezone` helper. The action enforces the existing rule that `recordingStartAt` requires a `recordingTimezone` and rejects the pair with a `VALIDATION` toast otherwise.
- The action enforces the same `getRequiredUserId` + `where: { id, userId }` ownership gate the other track mutations use; an admin acting on someone else's row is denied (matches the existing `updateTrackRecordingTimezone` pattern — a separate `role = ADMIN` override is left to a later slice if it is ever needed).
- The action runs a `prisma.track.update` with a single `trackListSelect` return value, then revalidates `/tracks/[slug]` and every trip page the track is attached to, matching the existing `updateTrackRecordingTimezone` revalidation block.

**Alternatives considered:**
- *Four small actions (one per column), parallel to `updateTrackRecordingTimezone`* — rejected. The form already collects all four values in one submit block; splitting into four actions means four server calls per save and four places to handle ownership/revalidation.
- *Reuse `updateTrack` and extend its input* — rejected. `updateTrack` is the base-fields action (title, slug, description, status, fileAssetId, activityTypeId). Mixing recording-metadata validation into it would force every `updateTrack` caller to thread the four fields through, even the create path that already uses `createManualTrack` to persist them.
- *Allow the action to also flip `timeSource` between `MANUAL` / `GPX` / `NONE`* — rejected. The owner can't legitimately change the source-of-truth classification by editing a row; the spec denies this case explicitly. `timeSource` is set by parse (for `GPX`) and by create (for `MANUAL` / `NONE`).

### Decision: Form reset hook branches by `track.timeSource`; submit handler dispatches accordingly

The existing form reset hook in `components/admin-pages/tracks-admin-panel.tsx:260-286` hard-codes the four fields to `""` / `"0"` per feature-112 decision 7 (the create path keeps the slot, the edit path stays display-only). The split:

- `track.timeSource === "MANUAL"` — populate `recordingStartAt` from `track.recordingStartAt?.toISOString().slice(0, 16)` (or `""` when `null`), `recordingTimezone` from `track.recordingTimezone ?? ""`, the three duration fields (`recordingDurationHours` / `recordingDurationMinutes` / `recordingDurationSeconds`) by running the inverse of `parseDurationInput` (a small `parseStoredDurationToHms(seconds: number | null)` helper added next to the existing `parseDurationInput`), and `includeSeconds` from `Boolean(track.recordingDurationSeconds && track.recordingDurationSeconds % 60 !== 0)`. All four inputs stay editable.
- `track.timeSource === "GPX"` — same pre-fill, but the four `FormField` blocks render with `readOnly` on the `Input` and a localized `trackRecordingMetadataFromFileHint` paragraph under them. The `FormControl` keeps the value visible but not editable. The form's submit handler skips the new server action dispatch.
- `track.timeSource === "NONE"` or legacy `null` — pre-fill stays empty (no editable values, no parse-derived values). The four inputs render editable so an owner can choose to populate them and save. The new action then writes the four columns, but the row's `timeSource` stays `NONE` because the action is `timeSource`-preserving (the spec explicitly denies the `timeSource` change in the new action's behaviour). A row that was created without timing therefore keeps the `NONE` badge on the four display surfaces even after the owner populates the fields, and the `MANUAL`-only `Recording start` / `Recording duration` lines do not render. Promoting `NONE` → `MANUAL` automatically is a separate concern (it would mean re-classifying a row after the fact, which is a different decision from "let the owner type a value"); a follow-up slice can add an explicit promotion if it is wanted.

The submit handler at `tracks-admin-panel.tsx:382` already calls `updateTrack({ id, ...trackPayload })`; the new code adds a follow-up block for `track.timeSource === "MANUAL"` that parses the four fields the same way the create path does (so the same `TrackStartAtParseError` / `TrackDurationInputError` toasts surface) and dispatches to the new action. For `track.timeSource === "GPX"` the follow-up block is skipped. For `track.timeSource === "NONE"` the follow-up block runs and effectively upgrades the row to `MANUAL` (the columns land; the next read sees the new values and surfaces them as `MANUAL`-only lines).

**Alternatives considered:**
- *Always dispatch the new action, even for `GPX`* — rejected. The spec explicitly denies the edit for `GPX` rows; silently sending the typed values for a `GPX` row would be a spec violation.
- *Use `disabled` instead of `readOnly` on the `GPX` inputs* — rejected. The values should remain visible and copyable; `disabled` would grey them out and prevent selection. `readOnly` keeps the values visible.
- *Move the four-field reset into a sub-component shared with the create path* — deferred. The form already has the four fields rendered as `FormField` blocks; refactoring them into a sub-component is a separable cleanup that the current PR doesn't need.

### Decision: Re-parse is the only path that backfills the new columns for legacy `GPX` rows

After this change, every pre-existing `GPX` track still has `recordingStartAt = null` and `recordingDurationSeconds = null` because no automatic backfill runs. The four display surfaces already render the existing `metadata.summary.time` block for these rows, so the page is functional — the columns are just empty. The next time an admin parses or reparses the row, the new `parseTrackGpx` column write populates them.

**Alternatives considered:**
- *Add a one-shot migration that recomputes the columns from `metadata.summary.time`* — rejected. The backfill would run over the entire `Track` table once and add a permanent maintenance item to the migration list; the same write happens lazily on the next parse, with no risk of stale data and no migration cost.
- *Backfill on read by computing the columns in `PublicTrack` when `timeSource === "GPX"`* — rejected. The whole point of this change is to remove the read-path special case; backfilling on read would re-introduce it.

## Risks / Trade-offs

- *Legacy `GPX` rows read as `timeSource: "GPX"` with null new columns until the next parse* → Acceptable: the four display surfaces already render the existing `metadata.summary.time` block for these rows, so the page is functional. The "Recording start" / "Recording duration" lines for `MANUAL` only don't fire (correct). When an admin parses, the columns populate and the next read sees them.
- *The form reset hook now has a three-way branch (`MANUAL` / `GPX` / else) on `timeSource`* → Mitigation: the branch is the only new state in the hook; the existing fields and the dirty-close guard keep working unchanged.
- *A new `parseStoredDurationToHms` helper duplicates the inverse of `parseDurationInput`* → Acceptable: the helper is a 5-line pure function placed next to `parseDurationInput` in `lib/track-duration-input.ts`; it has no callers outside the form reset, and the alternative (reading the stored seconds and dividing) would lose the "did the original include a non-zero seconds component" signal that `includeSeconds` needs.
- *The new server action runs three validations (`requireTrackRecordingTimezone` / `parseManualTrackStartAt` / `parseDurationInput`) on every edit* → Acceptable: each is pure, runs in microseconds, and rejects with a typed error the existing toast pattern already handles.
- *The new action trusts the existing `where: { id, userId }` ownership gate and does not add an `ADMIN` override* → Acceptable: matches the existing `updateTrackRecordingTimezone` pattern; an admin who needs to edit another user's track metadata can use the existing admin surfaces or impersonation flows, both of which are out of scope for this slice.

## Migration Plan

No database migration. The columns already exist from feature-112. The change is a series of in-place edits to:

- `app/_data/tracks.ts` — extend `parseTrackGpx` with the column write, add `updateTrackRecordingMetadata`.
- `components/admin-pages/tracks-admin-panel.tsx` — branch the form reset hook by `track.timeSource`, extend the submit handler to dispatch the new action for `MANUAL` / `NONE` rows, add `readOnly` + hint to the four inputs for `GPX` rows.
- `lib/track-duration-input.ts` — add the `parseStoredDurationToHms` helper.
- `app/i18n/locales/{en,ru}/trips.json` — add `trackRecordingMetadataFromFileHint` (read-only "from file" hint shown under the four inputs on a `GPX` row).

Rollback is `git revert` of the change commit. After rollback, the four display surfaces still render the existing `metadata.summary.time` block for `GPX` rows (so no public regression), the `Place on map` create path still persists the four columns correctly (so no create regression), and the edit dialog returns to the feature-112 display-only behavior (so no edit regression — owners lose the ability to type new values, but that path was a no-op before the change anyway).

## Open Questions

- *Should `NONE` → `MANUAL` promotion happen automatically when the edit populates a value?* Resolved: no, the action is `timeSource`-preserving. A `NONE` row that gets a value typed in stays `NONE` and the four display surfaces show the `NONE` badge with no `Recording start` / `Recording duration` lines. A follow-up slice can add an explicit `timeSource` flip on the new action when at least one of the four columns becomes non-null, or expose a separate "promote to MANUAL" action.
- *Should the `trackRecordingMetadataFromFileHint` hint live in the same form slot as the four inputs, or in a small `<Alert>` above them?* The current design assumes an inline paragraph under the inputs; a visual review can move it to a `<Alert>` if it feels too subtle.

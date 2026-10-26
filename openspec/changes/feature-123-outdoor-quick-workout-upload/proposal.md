# Proposal

## Why

**Recording a walk today takes a form with more fields than the walk has facts.** The owner opens `My workouts`, clicks `Add track`, lands in the shared `TrackFormDialog` with a tabbed surface — `Upload GPX` beside `Place on map` — and is asked for a title, a slug, a status, a kind, an activity type, a description, a recording timezone, a recording start, a recording duration. The GPX file is the only thing that carries real information; everything else is either a duplicate of what the file already says or a decision the owner has to re-make on every single walk.

The owner's own words describe the flow they want: click a button, a modal opens, the track is uploaded, the data pulls itself in, save, done. The name is the one field worth keeping, because a name is a judgement ("Morning walk"), not a fact — and it can be suggested rather than typed.

The project already holds every ingredient: the `trackGpxUploader` route (16 MB, one file, returns a `fileAssetId`), the shared `TrackGpxUploadSection` dropzone, the GPX parser (`lib/track-gpx-parser.ts`), the trust gate and the verified-resource quota on track uploads, the trust-gated action shape `createManualTrack` returns, and the activity-type dictionary. What is missing is the surface that assembles them into one click.

This change builds that surface. It is deliberately parameterized by activity type: the first button is `Add a walk` (Russian: `Добавить прогулку`), bound to the `walking` activity type, and a later `Add a run` is the same dialog with a different activity type and different wording.

## What Changes

- **`My workouts` gains a `Add a walk` button.** The button opens a small modal whose only fields are the GPX file, the title, and the shoes. Everything else — the activity type, the kind, the status, the slug, the parsed distance, duration, and recording start — is filled in automatically.
- **The title is suggested from the file, and stays editable.** The dialog reads the recording start time out of the dropped GPX and suggests `Morning walk` / `Дневная прогулка` from it, using the wording of the button's activity type. The owner can type something else; the suggestion is only a default.
- **The file is read in the browser, once.** The GPX parser is already isomorphic, so the dialog extracts the recording start, the distance, and the duration from the dropped file itself and shows them while the upload is still running. The server re-parses the same file when it saves, and the stored metadata comes from that parse.
- **The server fills the rest.** The save writes a `TRAINING` track in `DRAFT`, with the activity type the button was bound to, a slug derived from the activity type and the recording date and time, the parsed metadata, the mirrored recording columns, and the UTC offset the file's own timestamps carry as the recording timezone.
- **The shoes are optional and owner-only.** The dialog offers the owner's own gear that fits the activity type, and the chosen pair is attached to the new track through the server path `feature-122-outdoor-track-gear-assignment` adds.

### Non-goals

- **No publishing.** The quick upload creates a `DRAFT`; publishing stays an explicit act in the track form, exactly as it is for every other track.
- **No description, no recording timezone, no recording duration input.** The duration comes from the file. The recording timezone comes from the file too — the offset its timestamps carry — but it is not a field the dialog asks about: the owner replaces it with a named zone in the track form when they want one.
- **No editing inside the dialog.** The dialog creates; the existing form edits.
- **No public surface.** The quick upload creates a private draft. Nothing about it changes what a visitor sees.
- **No remembering the shoes.** Which pair is preselected next time is `feature-124-outdoor-gear-preferred-per-activity`; this change attaches the pair that was chosen, and nothing else.
- **No batch import.** One file, one walk.
- **No new activity-type buttons.** Only the activity types that have a wording entry get a button — `walking` to begin with. A `running` button is a wording entry, not a code change.

## Capabilities

### New Capabilities

- `outdoor-quick-workout-upload` — the one-click path that turns a GPX file into a saved workout: the per-activity-type button, the minimal dialog, the automatic filling, and the automatic title suggestion.

### Modified Capabilities

- `outdoor-tracks` — a GPX file's own UTC offset becomes a valid recording timezone and is stored as the starting point for the track it produced; the recording-timezone field stays editable on a GPX-sourced track, because the file names an offset and the owner names the zone; and the focused `Set recording timezone` action no longer pre-fills the field with the browser's timezone.

`outdoor-gear` keeps its current requirements — the shoes are attached through the relation `feature-122` adds, not by changing the inventory.

## Impact

- **Schema**: none. The quick upload writes the columns that already exist.
- **Data layer**: one new action, `createQuickWorkout`, in `app/_data/tracks.ts` — the trust gate, the quota, the file-asset guard, the gear guard, the parse, the unique slug, and the create, in that order.
- **Components**: one new client dialog (`components/track-pages/quick-workout-upload-dialog.tsx`), a small addition to the shared `TrackGpxUploadSection` (an optional hook that hands the dropped `File` to the caller), and one button in the shared track panel, shown only on `My workouts`.
- **i18n**: a new `quickWorkout` block in the `trips` namespace for `en` and `ru` — the per-activity-type wording, the dialog labels, and the four dayparts.
- **Routes**: none. The button lives on the existing `My workouts` page.
- **Public surfaces**: none. The quick upload creates a `DRAFT` track, and the public read path is untouched.
- **Depends on**: `feature-122-outdoor-track-gear-assignment` (the shoes are attached through it), `feature-101-outdoor-track-activity-types` (the dictionary the button is bound to), `feature-120-track-workout-kind` (the `TRAINING` kind the button creates), and the existing GPX upload route and parser.

# Proposal

## Why

**The fastest path in the product ends with the result hidden.** The quick upload saves a walk in one click, and the walk lands as a draft: it sits in the owner's own tables until somebody opens the track form and moves the status to `PUBLISHED` by hand. Every other quick upload — a file into a form, a save, a done — ends with the content visible; this one ends with a second, separate errand.

For a personal site the workout *is* the content. The recording is already made, the title is already suggested from the file, the distance and the duration are already parsed. The status is the only thing standing between "I walked" and "here is the walk", and the owner has to go and find it.

The owner decided: the quick upload publishes.

## What Changes

- **The quick upload creates the track published.** `createQuickWorkout` writes `status: "PUBLISHED"` instead of `status: "DRAFT"`. The saved workout is immediately one of the published tracks and is reachable on its public page by its slug.
- **Nothing else changes status.** The other creation paths — the track form, the manual track, the GPX upload — keep their own `DRAFT` default. Only the one-click path publishes.
- **The GPX file stays private.** Publishing the track publishes the *track*: its title, its map, its metadata. The file asset keeps the private visibility the shared upload route gave it, so the public page offers no download of that file. The file's visibility stays a separate switch in the file manager.

### Non-goals

- **No "save as draft" control in the dialog.** The default is published; a per-dialog override is a separate decision, and the shape of a status control is exactly what the tracks-page analysis has to answer (see the research candidate in `openspec/research-backlog.md`).
- **No change to the global track default.** `DEFAULT_TRACK_STATUS` stays `DRAFT` — publishing every manual track as well is a wider change than this one, and the other paths have their own reasons to stay editable.
- **No change to the trust gate, the quota, the refusals, or the order of the checks.** Everything that can refuse a quick upload still refuses it, exactly as before.
- **No change to the file-visibility rules.** The `outdoor-tracks` capability already owns "Public track GPX downloads respect file visibility"; this change does not touch it.
- **No change to the wording.** The dialog says the same thing it said before.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-quick-workout-upload` — the status the quick upload writes. The requirement that describes the save changes from "the track is a draft" to "the track is published", and a new requirement states what that means observably: the saved workout joins the published tracks and is reachable on its public page.

## Impact

- **Data layer**: `app/_data/tracks.ts` — `createQuickWorkout` writes the published status. One line of behavior, plus the comment above it that names the status.
- **Schema**: none. No model, no column, no migration.
- **Public surfaces**: a quick-uploaded track now appears in `/tracks` and on `/tracks/[slug]`. The revalidation already covers the list (`revalidateTrackPaths` revalidates `/tracks`), and the detail page is read per request by slug.
- **Owner surfaces**: unchanged. The owner's tables never filtered on the status, so a draft and a published track already look the same there.
- **Wording**: none. The dialog has no status copy, and the track tables have no status column.

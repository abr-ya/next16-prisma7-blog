# Proposal

## Why

The owner's private note on a published track can only be edited by opening the full track dialog or completing a draft. From the page where the note is actually read, there is no way to add one or fix a typo.

This is a small follow-up to `feature-141`: one owner-gated action and a compact editor on the track page.

## What Changes

- Add `updateTrackPrivateNote(trackId, privateNote)` in `app/_data/tracks.ts`: owner-scoped, updates only `privateNote`, accepts up to 2000 characters, clears on an empty value, revalidates the detail page, and does not touch any other column.
- Add `canEditPrivateNote` to the public track payload — the viewer owns the track. The note itself keeps its existing owner-only projection.
- On `/tracks/[slug]`, replace the server-rendered note block with a client `TrackPrivateNoteSection`: the owner sees an edit icon next to the note and an **Add private note** affordance when it is empty; the editor is a compact dialog with a 2000-character textarea, Save, and Cancel.
- Clearing the note hides the block again.
- No schema change, no admin access, no change to the public payload for other viewers.

## Non-goals

- Notes on drafts or in the workouts table (the detail page is the home; `feature-149` may surface drafts later).
- Rich text, attachments, or note history.
- Administrator editing of another user's note.
- Any change to how the note is projected or stored.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the owner edits the private note from the published track page.

## Impact

- `app/_data/tracks.ts` — the action, its validation, and the `canEditPrivateNote` payload flag.
- A new client editor component and the note block on `/tracks/[slug]`.
- No schema, migration, API, or dependency changes.

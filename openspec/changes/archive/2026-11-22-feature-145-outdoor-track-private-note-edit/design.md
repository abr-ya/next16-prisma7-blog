# Design

## Context

`Track.privateNote` exists since `feature-141` and is projected only when the viewer owns the track, so neither the public list nor the admin payload carries it. The owner can set it while creating or completing a draft and through the full track dialog, but the published track page renders it read-only.

## Action

`updateTrackPrivateNote(trackId, privateNote)` in `app/_data/tracks.ts`:

1. Resolve the owner with `getRequiredUserId()`.
2. Normalize the value with the existing `normalizePrivateNote`, which trims and enforces the 2000-character limit; an empty value becomes `null`.
3. Update only `privateNote` on a row that belongs to the caller; a foreign or missing row answers not found.
4. Revalidate the detail path for the track's slug, the same way the other owner actions do.

No trust gate is added: this is an owner-private text field, not a resource-creating upload. The action returns the existing `{ ok } | { ok: false, code, message }` shape.

## Read Model

`PublicTrack` gains `canEditPrivateNote`, true when the viewer owns the track. It is derived from `viewerId === track.userId`, the same condition that already decides whether `privateNote` is included. The note stays `null` for every other viewer.

The public list payload is unchanged: it already excludes the note and will simply carry the additional boolean, which is harmless; if the list should stay lean, the field is detail-only through `toPublicTrack` because the list passes no viewer id.

## UI

A new client `TrackPrivateNoteSection` replaces the static block on `/tracks/[slug]`. It receives the track id and the initial note and renders:

- the existing dashed section with a **Pencil** icon button in the header when a note exists;
- an **Add private note** dashed button when the note is empty and the viewer may edit;
- a compact dialog with a textarea limited to 2000 characters, a character count, Save and Cancel; Save calls the action, toasts, closes, and refreshes the page.

The component is rendered only when `canEditPrivateNote` is true, so other viewers see exactly today's behavior — a note when it exists and nothing when it does not.

## Risks

- **Losing the visibility rule.** The note itself is still projected only to the owner; the new boolean reveals nothing else.
- **Accidental clears.** Save with an empty textarea clears the note by design; the dialog keeps Cancel and only saves on an explicit click.
- **Long text.** The textarea and the server share the 2000-character rule.
- **Revalidation scope.** Only the detail page needs to refresh; the list never shows the note.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx openspec validate --changes --strict`, and a production build. Browser checks are deferred to a manual QA candidate: add a note, edit it, clear it, confirm the block disappears, and confirm another viewer never sees the note or the controls. No new data beyond editing an existing owned note.

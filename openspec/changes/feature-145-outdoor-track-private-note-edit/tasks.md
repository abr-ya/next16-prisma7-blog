# Tasks

- [ ] 1.1 Add `updateTrackPrivateNote(trackId, privateNote)` to `app/_data/tracks.ts`: owner scope, `normalizePrivateNote`, update only `privateNote`, revalidate the detail path, and return the existing result shape.
- [ ] 1.2 Add `canEditPrivateNote` to `PublicTrack` and map it from the viewer id.
- [ ] 2.1 Add `TrackPrivateNoteSection`: the existing note block, an **Add private note** affordance when empty, and an edit dialog with a 2000-character textarea, Save, and Cancel.
- [ ] 2.2 Replace the static note block on `/tracks/[slug]` with the section and render it only for the owner.
- [ ] 2.3 Toast the outcome and refresh the page after a save.
- [ ] 3.1 Run `npm run tsc`.
- [ ] 3.2 Run `npm run lint` and targeted `npx eslint` for the touched files.
- [ ] 3.3 Run `npx openspec validate --changes --strict`.
- [ ] 3.4 Run a production build in the sandbox, or ask the owner to run it locally.
- [ ] 3.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`.

# Tasks

## 1. Rename action

- [x] 1.1 Add `renameTrackFileAsset({ trackId, name })` in `app/_actions/files.ts`: resolve the track with its owner, its `routeId`, and its file asset in one query; the track must belong to the signed-in owner, must own its GPX file, and its file asset must be `ACTIVE`; verify each refusal returns its documented code.
- [x] 1.2 Normalize the base name — trim it, strip path separators and control characters, refuse it when nothing is left — and store it with the `.gpx` suffix; leave the stored object, its provider key, and its URL untouched; verify the file asset carries the new name and nothing else changed.
- [x] 1.3 Revalidate the track page and `/admin/files` after the write so the public page and the admin list show the new name.

## 2. Public page control

- [x] 2.1 Add `TrackFileRenameButton` in `components/track-pages/`: an icon-only button that opens a modal with one field for the base name and a fixed `.gpx` suffix; saving calls the action, reports success or failure, and refreshes the page.
- [x] 2.2 Render the control on `/tracks/[slug]` next to the displayed file name, only for the track owner and only for a track that owns its GPX file; verify a route-based workout and a foreign viewer see no control.
- [x] 2.3 Add the copy in English and Russian in the trips namespace: the control's label, the modal title, the field label, save and cancel, and the success and failure messages; verify both locale files parse.

## 3. Verification

- [x] 3.1 Run `npm run tsc`, targeted ESLint on the changed files, and `openspec validate "feature-147-outdoor-track-file-rename" --strict`, and confirm all pass.
- [x] 3.2 Ask the owner to run `npm run build` locally and confirm it passes.

## 4. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as a candidate in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 4.1 — and are not tasks of this change anymore:

- The rename control appears next to the file name on the owner's own workout and nowhere else; a workout built on a route shows no control.
- The modal holds the base name with a fixed `.gpx` suffix; saving changes the name on the page.
- The downloaded file carries the new name, and the download URL is the one the file had before the rename.
- The new name is what an anonymous visitor sees as well; the administrator's file list shows it too.
- An empty name is refused with a message and the file keeps its previous name.

- [x] 4.1 File the deferred browser checks as a candidate in `openspec/backlog.md` rather than leave them open here.

## Workflow follow-up

- Sync the `outdoor-tracks` and `file-sharing-structure` deltas into the main specs and archive the change after review.
- Add the completed `feature-147-outdoor-track-file-rename` entry to the feature history on archive.

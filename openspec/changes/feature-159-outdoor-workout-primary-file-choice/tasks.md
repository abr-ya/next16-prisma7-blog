# Tasks

- [ ] 1.1 Add `canChangePrimaryFile` to `PublicTrack`: owner, no route, `READY`, own active `TRACK_GPX` file, and at least one secondary file.
- [ ] 1.2 Add `makeTrackPrimaryFile(geometryId)` to `app/_data/tracks.ts`: owner-scoped geometry lookup, the shared guard, and a transactional swap of the target geometry and the current primary file/metadata.
- [ ] 1.3 After the swap, revalidate the detail path and call `parseTrackGpx` to refresh the mirrored recording columns, timezone, and capability marker; report a failed reparse without rolling the swap back.
- [ ] 2.1 Add **Make primary** to each secondary row in `TrackExtraFilesSection` when `canChangePrimaryFile`, with a `ConfirmDialog` that names the new map/distance/time source.
- [ ] 2.2 Toast the result, refresh the page, and keep the action absent for route-primary, pending, or foreign workouts.
- [ ] 2.3 Pass the new flag from `/tracks/[slug]`.
- [ ] 3.1 Run `npm run tsc`.
- [ ] 3.2 Run `npm run lint` and targeted `npx eslint` for the touched `app/_data` and `components/track-pages` files.
- [ ] 3.3 Run `npx openspec validate --changes --strict`.
- [ ] 3.4 Run a production build in the sandbox, or ask the owner to run it locally.
- [ ] 3.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`.

# Tasks

## 1. Extraction and metadata

- [ ] 1.1 Add `readGpxCreator` and `readGpxDeviceName` to `lib/track-gpx-parser.ts` with the attribute, entity, namespace, trimming and 120-character rules from the design.
- [ ] 1.2 Add `TrackGpxSourceInfo` and the optional `sourceInfo` field; pass the extracted object into both metadata creators, including a failed parse.
- [ ] 1.3 Add `sourceInfo` to `TRACK_GPX_PARSER_CAPABILITIES`, keep `TRACK_GPX_METADATA_VERSION` at `v1`, and normalize the object in `readTrackGpxMetadata`.
- [ ] 1.4 Add the badge and legend label helpers with the documented precedence and no device guessing.

## 2. Payload and map

- [ ] 2.1 Add `sourceInfo` to `PublicTrack` from the resolved parse metadata.
- [ ] 2.2 Add `legendLabel` to `TrackMapViewModel`; compute it for the primary line (device, app, `Manual route`, or null) and for each secondary file from its own metadata.
- [ ] 2.3 Make the map legend render `legendLabel ?? title`; keep the hidden-when-single-line rule.

## 3. UI

- [ ] 3.1 Show a source badge on `/tracks/[slug]` when a device or app is known; keep the existing time-source badge and skip the extra badge for manual workouts.
- [ ] 3.2 Confirm the older-parse case shows no badge and relies on **Update track data**.

## 4. Verification

- [ ] 4.1 Add `scripts/check-track-source-info.ts` with creator quotes, entities, namespaced and plain device elements, missing values, empty values, and the cap.
- [ ] 4.2 Add a section for the script to `scripts/README.md`.
- [ ] 4.3 Run `npm run tsc`, `npm run lint`, targeted ESLint, the script, and `npx openspec validate --changes --strict`.
- [ ] 4.4 Run a production build in the sandbox, or ask the owner to run it locally.
- [ ] 4.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`.

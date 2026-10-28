# Tasks

## 1. The spec

- [x] 1.1 In `openspec/changes/feature-125-outdoor-quick-upload-published-by-default/specs/outdoor-quick-workout-upload/spec.md`, write the delta: modify the requirement "Saving the quick upload creates a workout with every derived value filled in" — the created track is published, not a draft — and add the requirement "The quick upload publishes the workout it creates". Verify that the modified requirement carries every scenario the main spec has, unchanged apart from the status line.
  - The delta carries the whole requirement block with all seven of its scenarios; only the status line of the first scenario changed.
- [x] 1.2 Verify that no other capability changes. The GPX download rule stays in `outdoor-tracks` ("Public track GPX downloads respect file visibility"), the track status stays editable in the track form, and the trust gate and the quota are untouched.
  - The `outdoor-tracks` spec is not in the delta. The track form's status field is not touched, and the gate and the quota run before the row is written.

## 2. The data layer

- [x] 2.1 In `app/_data/tracks.ts`, `createQuickWorkout` writes `status: "PUBLISHED"` instead of `status: "DRAFT"`. Verify that the other creation paths keep their own default — `DEFAULT_TRACK_STATUS` stays `DRAFT` for `createTrack` and `createManualTrack`.
  - One line of behavior plus the comment above it. `DEFAULT_TRACK_STATUS` (`app/_data/tracks.ts:194`) is untouched, so the full form and the manual track still create drafts.
- [x] 2.2 Verify that the published track reaches the public surfaces: `revalidateTrackPaths` already revalidates `/tracks`, and the public detail page is read by slug. Verify that the public page of a quick-uploaded track renders with a private file — the download is simply unavailable, per the existing file-visibility rule.
  - `revalidateTrackPaths` (`app/_data/tracks.ts:615`) revalidates `/tracks` after the write, and the detail page resolves by slug per request. The public projection computes the download from the *file asset's* visibility (`toPublicTrack`, `app/_data/tracks.ts:512`), so a private file yields `downloadUrl: null` and the page renders without the download block.
- [x] 2.3 Verify that the refusals are unchanged: the trust gate, the verified quota, the title, the activity type, the file, the gear, the slug, and the parse all refuse exactly what they refused before, and a refused save creates nothing.
  - The status is written inside the same `createWithinVerifiedResourceQuota` transaction as the row, and every check runs before it — none of them reads the status.

## 3. Validate

- [x] 3.1 `npm run tsc` — passes clean.
- [x] 3.2 `npx eslint app/_data/tracks.ts --quiet` — clean.
- [x] 3.3 `npm run lint` — clean.
- [x] 3.4 `npx openspec validate feature-125-outdoor-quick-upload-published-by-default` — valid.
- [x] 3.5 `npm run build` — the user runs the build; not run by the agent. The owner runs it and records the result here.
  - Deferred on 2026-10-27 to the manual QA row `outdoor-quick-upload-published-manual-qa`, which carries the browser checks and the build. The owner runs the build.

## 4. Docs

- [x] 4.1 `openspec/backlog.md`: a candidate row becomes the `In Progress` row `feature-125-outdoor-quick-upload-published-by-default` at promotion time.
  - The row is in the "Outdoor Content High-Priority Roadmap" table, where the feature-124 row used to be.
- [x] 4.2 The browser check — a saved quick upload appears among the published tracks and on its own public page, and its public page offers no GPX download — is filed as a manual QA candidate in `openspec/backlog.md` rather than left open here.
  - Filed as `outdoor-quick-upload-published-manual-qa` in the Manual QA Follow-ups table. It carries the browser checks of the new default — the published track on `/tracks` and on its own page, the private file, the unpublish, the unparsed fallback, and the unchanged refusals.
- [x] 4.3 The analysis of the tracks page, the visibility of the tracks, and a status control in the table is filed as a candidate in `openspec/research-backlog.md`.
  - Filed as `tracks-page-visibility-and-status-toggle`, a `Candidate` in the research pool: the public `/tracks` page, the visibility model as it stands, and whether a per-row publish/unpublish belongs in the track table.

## Not in this change

- A status control in the quick upload dialog, a status column in the track tables, or a per-row publish toggle.
- Any change to the file visibility rules, the trust gate, the quotas, or the wording.
- Any change to the draft default of the other track creation paths.

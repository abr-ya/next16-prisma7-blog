## 1. Persisted timezone and server contract

- [ ] 1.1 Add a forward Prisma migration for nullable `Track.recordingTimezone`, regenerate the Prisma client through the project flow, and preserve every existing track/metadata row unchanged.
- [ ] 1.2 Add one server-side IANA-timezone validation and formatting utility with an explicit UTC fallback for legacy records; cover valid identifiers, invalid input, and the `Europe/Sofia` historical-DST example.
- [ ] 1.3 Add a narrowly scoped, server-authoritative recording-timezone update action and extend track list/detail projections to return the persisted value without trusting the browser-proposed value.
- [ ] 1.4 Keep GPX parser and photo-to-track matching inputs absolute-time based; add focused deterministic coverage proving timezone changes do not alter parsed instants, duration, geometry, or match results.

## 2. Administrator selection and correction workflow

- [ ] 2.1 Add a recording-timezone indicator and focused action to each `/admin/tracks` row. Its dialog proposes the hydrated browser IANA timezone, allows a different supported selection, and saves only that setting.
- [ ] 2.2 Show a clear unconfirmed legacy state and explicit UTC display for tracks without a persisted timezone; allow an administrator to select and save a correction without reparsing GPX or editing other track fields.
- [ ] 2.3 Render parsed start/finish/range in the stored track timezone, including a visible timezone label, while keeping existing parse/evidence feedback intact.

## 3. Consistent published and trip presentation

- [ ] 3.1 Thread the stored recording timezone through public `/tracks`, `/tracks/[slug]`, and published hike/trip projections that show linked-track recording times.
- [ ] 3.2 Replace viewer/runtime-local time formatting on those surfaces with the shared explicit-timezone formatter and clearly label the selected timezone or UTC legacy fallback.
- [ ] 3.3 Verify a `2016-11-10T10:35:42Z` timestamp on a `Europe/Sofia` track renders as 12:35 regardless of browser timezone.

## 4. Verification and deferred coordinate-review QA

- [ ] 4.1 Update affected outdoor-track documentation/spec checklist and retain the separate deterministic, no-AI route-timezone candidate plus the GPX and EXIF timestamp-normalization candidates in the backlog.
- [ ] 4.2 Run `openspec validate feature-075-outdoor-track-source-timezone-selection --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [ ] 4.3 Ask the user to confirm a local `npm run build` after implementation and record the result.

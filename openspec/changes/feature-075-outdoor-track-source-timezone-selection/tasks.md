## 1. Persisted timezone and server contract

- [x] 1.1 Add a forward Prisma migration for nullable `Track.recordingTimezone`, regenerate the Prisma client through the project flow, and preserve every existing track/metadata row unchanged.
- [x] 1.2 Add one server-side IANA-timezone validation and formatting utility with an explicit UTC fallback for legacy records; cover valid identifiers, invalid input, and the `Europe/Sofia` historical-DST example.
- [x] 1.3 Add a narrowly scoped, server-authoritative recording-timezone update action and extend track list/detail projections to return the persisted value without trusting the browser-proposed value.
- [x] 1.4 Keep GPX parser and photo-to-track matching inputs absolute-time based; add focused deterministic coverage proving timezone changes do not alter parsed instants, duration, geometry, or match results.

## 2. Administrator selection and correction workflow

- [x] 2.1 Add a recording-timezone indicator and focused action to each `/admin/tracks` row. Its dialog proposes the hydrated browser IANA timezone, allows a different supported selection, and saves only that setting.
- [x] 2.2 Show a clear unconfirmed legacy state and explicit UTC display for tracks without a persisted timezone; allow an administrator to select and save a correction without reparsing GPX or editing other track fields.
- [x] 2.3 Render parsed start/finish/range in the stored track timezone, including a visible timezone label, while keeping existing parse/evidence feedback intact.

## 3. Consistent published and trip presentation

- [x] 3.1 Thread the stored recording timezone through public `/tracks`, `/tracks/[slug]`, and published hike/trip projections that show linked-track recording times.
- [x] 3.2 Replace viewer/runtime-local time formatting on those surfaces with the shared explicit-timezone formatter and clearly label the selected timezone or UTC legacy fallback.
- [x] 3.3 Verify a `2016-11-10T10:35:42Z` timestamp on a `Europe/Sofia` track renders as 12:35 regardless of browser timezone.

## 4. Explicit photo-to-track time context

- [ ] 4.1 Add shared deterministic presentation of a stored photo capture instant as UTC plus its existing timezone-evidence label, without using browser-local time as the comparison value.
- [ ] 4.2 Render the explicit photo context in authorized photo details and coordinate-review candidates, and render every source-track range through its persisted recording timezone formatter.
- [ ] 4.3 Add focused deterministic coverage proving the Sofia display context does not alter the prior absolute-time candidate result.
- [ ] 4.4 Extend versioned photo metadata extraction to retain the full standard EXIF GPS block and prefer complete valid `GPSDateStamp` plus `GPSTimeStamp`; cover Sofia GPS fixtures and safe refresh of existing metadata.

## 5. Verification

- [ ] 5.1 Run `openspec validate feature-075-outdoor-track-source-timezone-selection --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [ ] 5.2 Confirm the local `npm run build` after the new presentation work; record the result.
- [ ] 5.3 Manually verify the `/admin/tracks` timezone action: set `Europe/Sofia` on a parsed UTC track, confirm no reparse is requested, confirm the labelled time is stable in admin, `/tracks`, track detail, and linked trip display, and confirm photo detail/review makes the UTC comparison unambiguous.

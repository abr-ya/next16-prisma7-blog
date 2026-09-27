# Tasks

## 1. Capture-time metadata preservation

- [x] 1.1 Extend versioned photo EXIF metadata types, normalization, and extraction so offset-backed camera timestamps retain their original wall-clock value and numeric offset alongside derived UTC; retain camera-local time when GPS UTC is the comparable capture source; verify old metadata remains readable and new parsed fixtures preserve both representations.
- [x] 1.2 Update shared capture-time formatters to distinguish source camera time, EXIF offset, IANA-timezone assumptions, and stored UTC; verify GPS UTC, offset-backed EXIF, and timezone-less EXIF outputs remain unambiguous.

## 2. Authorized detail and recovery experience

- [x] 2.1 Update authorized trip-photo details and admin metadata summaries to display source camera-local time first and UTC as supporting context, including when GPS UTC coexists; verify existing read-only authorized viewers retain only safe context.
- [x] 2.2 Surface an unambiguous linked-track timezone as a proposal for timezone-less camera time and connect owner/admin confirmation or replacement to the existing safe workflow; verify ambiguous tracks never cause automatic timezone selection.
- [x] 2.3 Detect legacy metadata with a comparable UTC instant but no preserved camera-local time and show only owners/admins a direct EXIF-refresh action; verify it changes no metadata, UTC instant, or coordinate until they explicitly refresh.

## 3. Validation and tracking

- [x] 3.1 Add or update deterministic parser/formatter coverage for offset-backed, timezone-less, GPS UTC, and legacy metadata cases; verify the supported project test approach passes, or record that no harness exists. No dedicated test runner or existing EXIF fixture harness is configured in this project as of 2026-09-27.
- [x] 3.2 Run `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files; verify each applicable command passes.
- [x] 3.3 Run `openspec validate feature-096-outdoor-photo-camera-time-display --strict` and ask the user to run `npm run build` locally. Strict validation passed; local `npm run build` passed on 2026-09-27. Owner/admin refresh verified: camera-local `2016-11-10 15:29:44` and GPS UTC `2016-11-10 13:29` render separately. Read-only browser QA is intentionally deferred because this project has no test runner or EXIF fixture harness, and establishing either is outside this feature slice.
- [ ] 3.4 Keep `feature-096-outdoor-photo-camera-time-display` marked In Progress in `openspec/backlog.md` until implementation is complete.

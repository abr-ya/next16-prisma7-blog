# Tasks

## 1. Capture-time metadata preservation

- [ ] 1.1 Extend versioned photo EXIF metadata types, normalization, and extraction so offset-backed camera timestamps retain their original wall-clock value and numeric offset alongside derived UTC; verify old metadata remains readable and new parsed fixtures preserve both representations.
- [ ] 1.2 Update shared capture-time formatters to distinguish source camera time, EXIF offset, IANA-timezone assumptions, and stored UTC; verify GPS UTC, offset-backed EXIF, and timezone-less EXIF outputs remain unambiguous.

## 2. Authorized detail and recovery experience

- [ ] 2.1 Update authorized trip-photo details and admin metadata summaries to display source camera-local time first and UTC as supporting context; verify existing read-only authorized viewers retain only safe context.
- [ ] 2.2 Surface an unambiguous linked-track timezone as a proposal for timezone-less camera time and connect owner/admin confirmation or replacement to the existing safe workflow; verify ambiguous tracks never cause automatic timezone selection.
- [ ] 2.3 Detect legacy offset-backed metadata lacking source camera time/offset and show only owners/admins an EXIF-refresh recommendation; verify it changes no metadata, UTC instant, or coordinate until they explicitly refresh.

## 3. Validation and tracking

- [ ] 3.1 Add or update deterministic parser/formatter coverage for offset-backed, timezone-less, GPS UTC, and legacy metadata cases; verify the supported project test approach passes, or record that no harness exists.
- [ ] 3.2 Run `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files; verify each applicable command passes.
- [ ] 3.3 Run `openspec validate feature-096-outdoor-photo-camera-time-display --strict`, ask the user to run `npm run build` locally, and manually verify owner/admin and read-only trip-photo detail scenarios in a browser.
- [ ] 3.4 Keep `feature-096-outdoor-photo-camera-time-display` marked In Progress in `openspec/backlog.md` until implementation is complete.

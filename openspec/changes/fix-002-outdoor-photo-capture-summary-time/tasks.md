# Tasks

## 1. Preserve camera-local capture provenance

- [x] 1.1 Update photo EXIF summary aggregation to select the first image with an absolute capture instant or valid capture-time provenance; verify a timezone-less `CreateDate` produces summary `localWallTime` and `MISSING` timezone evidence while keeping summary `capturedAt` null.
- [x] 1.2 Add focused fixture or unit coverage for `CreateDate: 2020:11:07 13:07:17` without an offset; verify it is shown as unconfirmed camera-local time and `ModifyDate` alone remains ineligible.

## 2. Verify existing track-time flow

- [ ] 2.1 Confirm an owner/admin EXIF refresh of the affected photo retains the camera-local capture value; with exactly one `Europe/Moscow` linked-track timezone, verify the existing flow derives an instant and offers eligible candidates without changing authorization or direct-GPS precedence.
- [ ] 2.2 Confirm zero or multiple linked track timezones still require explicit timezone confirmation and never derive UTC from process/browser timezone.

## 3. Validation

- [x] 3.1 Run `npm run tsc` and targeted ESLint for changed TypeScript files; verify both pass.
- [ ] 3.2 Ask the user to run `npm run build` locally and manually refresh/inspect the affected photo; record the results in this checklist or handoff.
- [ ] 3.3 Verify no Prisma schema, migration, dependency, route, or public EXIF exposure change was introduced; keep the Fixes backlog row and checklist current.

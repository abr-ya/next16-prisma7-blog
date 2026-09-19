## 1. Safe capture-time model

- [x] 1.1 Add additive persisted metadata/schema support for original camera-local time, selected IANA timezone, normalization provenance, and derived UTC instant without rewriting raw EXIF.
- [x] 1.2 Change EXIF extraction and display so missing timezone evidence does not create or label an invented UTC instant.
- [x] 1.3 Add date-correct IANA timezone conversion and validation for an explicit photo-timezone assumption.

## 2. Matching and review workflow

- [x] 2.1 Resolve the distinct confirmed IANA timezones of linked published tracks and apply a provisional default only when exactly one exists.
- [x] 2.2 Exclude ambiguous camera-local times from automatic matching; use confirmed/default-assumed instants with visible provenance.
- [x] 2.3 Add owner/admin timezone confirmation controls and re-run eligible candidate reads after a change.
- [x] 2.4 Preserve existing inferred coordinates for review rather than silently overwriting them when the timezone premise changes.

## 3. Verification and tracking

- [x] 3.1 Mark the P0 candidate In Progress as `feature-083-outdoor-photo-capture-timezone-normalization` in the backlog.
- [x] 3.2 Run Prisma generation/migration validation if schema changes are required, `npm run tsc`, targeted ESLint, and `npm run lint` for changed app files.
- [x] 3.3 Ask the user to run `npm run build` locally. Defer manual verification to a later QA pass.

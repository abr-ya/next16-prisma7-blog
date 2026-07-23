## 1. Data Model And Helpers

- [x] 1.1 Add Prisma models for reusable video tags and video/tag assignments with additive migration coverage.
- [x] 1.2 Regenerate the Prisma client through the existing project flow.
- [x] 1.3 Add tag normalization helpers for trimming, casing, slug creation, and duplicate removal.
- [x] 1.4 Extend video data types and queries to include assigned tags for admin and public video reads.

## 2. Admin Assignment

- [x] 2.1 Extend video create and update actions to persist normalized tag assignments after preserving owner scoping.
- [x] 2.2 Add tag input or selection controls to the admin video form for create and edit flows.
- [x] 2.3 Load existing tag options for the admin video form without requiring a dedicated tag management page.
- [x] 2.4 Keep create/edit validation, provider metadata extraction, thumbnail behavior, channel assignment, and visibility behavior working with tags.
- [x] 2.5 Ask admins to confirm newly entered tags before creating them while allowing existing tags without confirmation.

## 3. Tag Badge Display

- [x] 3.1 Show assigned tag badges in the admin video table without breaking sorting, pagination, filtering, or row actions.
- [x] 3.2 Show assigned tag badges on the public video list only for videos returned by existing public visibility queries.
- [x] 3.3 Show assigned tag badges on public video detail only for public videos.
- [x] 3.4 Keep tag badges passive in this feature; do not add public tag filter links or tag management actions.

## 4. Backlog And Validation

- [x] 4.1 Keep public tag filtering deferred to `feature-014-public-video-tag-filtering`.
- [x] 4.2 Keep dedicated tag management deferred to `feature-015-video-tag-management`.
- [x] 4.3 Run Prisma schema/migration validation and client generation checks.
- [x] 4.4 Run `openspec validate feature-004-video-tags-foundation --strict`.
- [x] 4.5 Run `npm run tsc`.
- [x] 4.6 Run `npm run lint`.
- [x] 4.7 Run targeted ESLint for changed component files outside root lint coverage.
- [x] 4.8 Ask the user to run `npm run build` locally before closeout because schema and user-facing routes change.
- [x] 4.9 Remove temporary slug/debug logging before archive if video tags reuse `lib/slug-generator.ts`.
- [x] 4.10 Manually verify video create/edit tag assignment, admin tag badges, public tag badges, and unchanged public visibility behavior in a browser.

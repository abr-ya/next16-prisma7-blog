## Why

Admins need a small, concrete way to label saved videos before broader tag browsing or tag administration is designed. This slice adds the video tag foundation so tags can be assigned and displayed without expanding into public filtering or a full tag-management workflow.

## What Changes

- Add reusable video tag records and many-to-many video/tag assignment.
- Allow authenticated admins to assign existing or newly entered tags while creating or editing a video.
- Show assigned tag badges in admin video lists and public video surfaces where video metadata is already displayed.
- Keep public visibility rules unchanged: public surfaces only show tags for videos already visible to the visitor.
- Non-goals:
  - Public tag filtering remains a later backlog feature.
  - Dedicated tag management, including rename, delete, merge, colors, or ordering, remains a later backlog feature.
  - Full video search remains in `feature-006-video-search`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-library`: add foundational reusable video tag assignment and tag badge display behavior.

## Impact

- Affected routes: `/admin/videos`, `/admin/videos/{id}`, `/videos`, `/videos/{id}`.
- Affected data models: add reusable video tags and a video/tag relation; preserve existing video and channel data.
- Affected data access: video create/update reads and writes, admin/public video list includes, public detail includes.
- Affected UI surfaces: admin video form, admin video table, public video list, and public video detail.
- Validation should include Prisma schema/migration checks, `npm run tsc`, `npm run lint`, targeted ESLint for changed component files, and a local `npm run build` before closeout because routes and schema are affected.

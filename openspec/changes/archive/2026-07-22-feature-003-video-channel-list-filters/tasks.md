## 1. Data Access

- [x] 1.1 Extend video list query types to accept an optional channel filter.
- [x] 1.2 Add public channel filter validation so unsupported, missing, or hidden channel ids are ignored for `/videos`.
- [x] 1.3 Add a public channel options helper ordered by channel name and limited to channels attached to public videos.

## 2. Admin Video List

- [x] 2.1 Add channel filter controls to `VideosTable` with all-channels and per-channel options.
- [x] 2.2 Filter the loaded owned admin video rows by selected channel before table rendering.
- [x] 2.3 Keep count, sorting, pagination, and row actions working against filtered admin rows.

## 3. Public Video Browse

- [x] 3.1 Parse and normalize the `channel` search param in `/videos`.
- [x] 3.2 Pass the supported channel filter into `getPublicVideos` and filtered pagination metadata.
- [x] 3.3 Add compact public channel controls that preserve supported `sort` state and reset page when filters change.
- [x] 3.4 Preserve supported `sort` and `channel` state in public pagination links.
- [x] 3.5 Show an appropriate empty state for filtered public results.

## 4. Backlog And Validation

- [x] 4.1 Keep `feature-004-video-tags` as the next separate planned backlog feature.
- [x] 4.2 Run `openspec validate feature-003-video-channel-list-filters --strict`.
- [x] 4.3 Run `npm run tsc`.
- [x] 4.4 Run `npm run lint`.
- [x] 4.5 Run targeted ESLint for changed component files outside root lint coverage.
- [x] 4.6 Ask the user to run `npm run build` locally before closeout if routing or public behavior changed.
- [x] 4.7 Manually verify admin channel filtering, public channel URLs, pagination preservation, and invalid channel fallback in a browser.

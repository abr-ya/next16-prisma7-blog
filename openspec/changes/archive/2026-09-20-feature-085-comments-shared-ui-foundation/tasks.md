# Tasks

## 1. Shared presentation primitives

- [x] 1.1 Create shared client components for normalized comment list/item presentation, including existing avatar fallback, formatted date, safe `CommentText` rendering, and empty state; verify they accept `CommentListItem[]` without target-specific imports.
- [x] 1.2 Create a shared authenticated comment composer with explicit labels, placeholder, maximum length, pending/disabled state, and async creation callback; verify it retains label-to-textarea association, character count, and disabled empty submission behavior.
- [x] 1.3 Provide a narrow optional item-action extension point without adding visible video mutation controls; verify a consumer can omit it and the rendered video list remains unchanged.

## 2. Video integration

- [x] 2.1 Refactor `VideoCommentComposer` into a video-specific wrapper around the shared primitives while retaining `createVideoComment`, video id, toast messages, router refresh, and comment-count update; verify the existing video server actions and public-video checks are not changed.
- [x] 2.2 Preserve anonymous sign-in guidance and authenticated creation behavior on `/videos/[id]`; manually verify a public video with zero comments and one with existing comments in anonymous and authenticated sessions.
- [x] 2.3 Manually verify a supported plain URL remains a safe clickable link and an invalid URL candidate remains text after the UI extraction.

## 3. Validation and documentation

- [x] 3.1 Run `npm run tsc` and targeted ESLint for every changed component; verify both pass with no new diagnostics.
- [x] 3.2 Ask the user to run `npm run build` locally and report the result, because sandbox builds can fail while fetching Next/Google-font resources; record the result in the change notes or handoff. Local build passed on 2026-09-20; Next emitted non-fatal `Couldn't load fs`/`zlib` messages while collecting page data and still completed compilation, type checking, static generation, and optimization.
- [x] 3.3 Keep this checklist and the P0 backlog entry accurate as implementation progresses; verify no schema, migration, dependency, or public API changes were introduced.

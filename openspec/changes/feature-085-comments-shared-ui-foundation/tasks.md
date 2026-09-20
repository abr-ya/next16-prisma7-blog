# Tasks

## 1. Shared presentation primitives

- [ ] 1.1 Create shared client components for normalized comment list/item presentation, including existing avatar fallback, formatted date, safe `CommentText` rendering, and empty state; verify they accept `CommentListItem[]` without target-specific imports.
- [ ] 1.2 Create a shared authenticated comment composer with explicit labels, placeholder, maximum length, pending/disabled state, and async creation callback; verify it retains label-to-textarea association, character count, and disabled empty submission behavior.
- [ ] 1.3 Provide a narrow optional item-action extension point without adding visible video mutation controls; verify a consumer can omit it and the rendered video list remains unchanged.

## 2. Video integration

- [ ] 2.1 Refactor `VideoCommentComposer` into a video-specific wrapper around the shared primitives while retaining `createVideoComment`, video id, toast messages, router refresh, and comment-count update; verify the existing video server actions and public-video checks are not changed.
- [ ] 2.2 Preserve anonymous sign-in guidance and authenticated creation behavior on `/videos/[id]`; manually verify a public video with zero comments and one with existing comments in anonymous and authenticated sessions.
- [ ] 2.3 Manually verify a supported plain URL remains a safe clickable link and an invalid URL candidate remains text after the UI extraction.

## 3. Validation and documentation

- [ ] 3.1 Run `npm run tsc` and targeted ESLint for every changed component; verify both pass with no new diagnostics.
- [ ] 3.2 Ask the user to run `npm run build` locally and report the result, because sandbox builds can fail while fetching Next/Google-font resources; record the result in the change notes or handoff.
- [ ] 3.3 Keep this checklist and the P0 backlog entry accurate as implementation progresses; verify no schema, migration, dependency, or public API changes were introduced.

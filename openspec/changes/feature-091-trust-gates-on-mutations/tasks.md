# Tasks

## 1. Shared server authorization

- [ ] 1.1 Add a server-only trust-gate helper that resolves the current session, persisted trust level, and administrator role for supported mutation categories; verify anonymous, `NEW`, `RESTRICTED`, `VERIFIED`, `TRUSTED`, and administrator decisions follow the spec.
- [ ] 1.2 Define safe, actionable insufficient-trust and comment-rate-limit error results without leaking target data; verify callers can distinguish those failures from existing validation and visibility errors.

## 2. Gate scoped mutations

- [ ] 2.1 Apply the trust gate before writes in photo like and unlike mutations; verify `NEW`/`RESTRICTED` ordinary users cannot change a like while verified, trusted, and administrator users retain existing eligibility checks.
- [ ] 2.2 Apply the trust gate before video and photo comment create, update, and delete mutations; verify blocked users do not alter comments and eligible users retain existing owner and published-target behavior.
- [ ] 2.3 Apply the trust gate before ordinary trip creation and public or owner photo/track upload creation workflows; verify blocked users cannot create records, bind files, or leave partial state while existing owner/admin validation remains intact.

## 3. Shared comment anti-flood enforcement

- [ ] 3.1 Implement one reusable, transaction-safe 15-second comment-creation guard across the current video and photo comment domains; verify concurrent same-user requests persist at most one comment.
- [ ] 3.2 Wire every current comment creation action through the shared guard after trust and target checks; verify a successful video comment blocks an immediate photo comment by the same user, and a failed request does not consume the interval.
- [ ] 3.3 Add client-facing handling for insufficient-trust and rate-limit results where the current like/comment/trip/photo/track UI can surface them; verify server denial remains authoritative when invoking actions directly.

## 4. Validation and release checks

- [ ] 4.1 Run `npm run tsc` and verify TypeScript completes without errors.
- [ ] 4.2 Run `npm run lint` plus targeted ESLint for each changed file outside `app/`; verify all changed files pass linting.
- [ ] 4.3 Run `npm run build` locally and verify the production build completes; record any environment-specific result in the change notes.
- [ ] 4.4 Manually verify anonymous, `NEW`, `RESTRICTED`, `VERIFIED`, `TRUSTED`, and administrator flows for likes, comments, trip creation, and photo/track uploads; verify public reads remain available and record results in this checklist.
- [ ] 4.5 Update the feature checklist and backlog status with validation results before requesting archive.

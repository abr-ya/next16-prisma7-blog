## 1. Schema and Plugin Preparation

- [x] 1.1 Review the Better Auth Admin plugin schema requirements against the current `better-auth` version.
- [x] 1.2 Confirm the Prisma `User` model changes needed for plugin-compatible role and ban-status storage.
- [x] 1.3 Decide whether any Admin plugin `Session` fields are required for this slice or can be deferred.

## 2. Prisma Role Storage

- [x] 2.1 Add Better Auth-compatible Admin plugin fields to the Prisma auth models with safe defaults/nullability.
- [x] 2.2 Create a Prisma migration that backfills existing users to `user` and `banned = false`.
- [x] 2.3 Regenerate the Prisma client through the project flow.
- [x] 2.4 Do not edit `generated/prisma` manually.

## 3. Better Auth Integration

- [ ] 3.1 Add the Better Auth Admin plugin to `lib/auth.ts` while preserving `nextCookies()`.
- [ ] 3.2 Add the matching admin client plugin to `lib/auth-client.ts` if needed for typed admin helpers.
- [ ] 3.3 Keep email/password, Google, and GitHub provider behavior unchanged.
- [ ] 3.4 Confirm new public registration paths still receive the ordinary `user` role by default.

## 4. Role Helpers

- [ ] 4.1 Add shared role constants/types for `user` and `admin`.
- [ ] 4.2 Add a server-only helper to read the current authenticated user's persisted role.
- [ ] 4.3 Add a reusable server-only helper for requiring administrator access.
- [ ] 4.4 Keep `app/admin/layout.tsx` session-gated with `requireAuth()` rather than admin-only.
- [ ] 4.5 Do not implement `editor` checks in this slice.

## 5. Rollout Notes

- [ ] 5.1 Document the manual first-admin promotion path using Prisma Studio or SQL.
- [ ] 5.2 Document that `INITIAL_ADMIN_EMAIL` and automatic first-user promotion are intentionally absent.
- [ ] 5.3 Document which Better Auth Admin plugin user-management capabilities remain out of project UI scope.

## 6. Validation

- [ ] 6.1 Run `openspec validate feature-017-auth-admin-plugin-role-storage --strict`.
- [x] 6.2 Run Prisma schema/client validation after the schema change.
- [ ] 6.3 Run `npm run tsc`.
- [ ] 6.4 Run `npm run lint`.
- [ ] 6.5 Run targeted ESLint for changed files outside root lint coverage when needed.
- [ ] 6.6 Ask for or run `npm run build` local validation before closeout.
- [ ] 6.7 Run `git diff --check`.

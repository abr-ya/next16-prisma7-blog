## Why

Users should keep authenticated creator access while sensitive operations become role-aware. This change implements the first role-storage slice selected in `feature-016-admin-auth-roles-structure`: Better Auth Admin plugin conventions, persisted user roles, safe defaults, manual first-admin promotion, and minimal server-side role helpers.

## What Changes

- Add Better Auth Admin plugin support to the server auth configuration.
- Add the matching admin client plugin only where the project needs typed admin-role helpers.
- Add persisted role storage to the Prisma `User` model using Better Auth-compatible role strings.
- Default existing and newly created users to the ordinary `user` role.
- Document and support manual first-admin promotion through Prisma Studio or SQL after the migration.
- Add minimal server-only helpers for checking roles, including administrator checks for future sensitive surfaces.
- Keep `/admin` as an authenticated creator workspace; do not convert the entire admin shell to admin-only.
- Keep `editor` planned but unimplemented in this slice.

Non-goals:

- No admin user-management UI in this slice.
- No account creation/login flow changes in this slice.
- No email verification, password reset, invite, or account-management UX in this slice.
- No broad role-gating rollout across every admin page in this slice.
- No UploadThing global settings or all-user file dashboard implementation in this slice.

## Capabilities

### New Capabilities

- `auth-admin-plugin-role-storage`: Covers Better Auth Admin plugin adoption, persisted role storage, safe role defaults, manual first-admin promotion, and minimal server-side role helpers.

### Modified Capabilities

- `admin-auth-roles-structure`: Implements the planned role-storage follow-up from the accepted auth/roles structure.

## Impact

- Affects `lib/auth.ts`, `lib/auth-client.ts`, `lib/auth-utils.ts`, `prisma/schema.prisma`, Prisma migrations, and generated Prisma client output.
- May require Better Auth schema generation as a reference, but Prisma migration must remain project-owned because the project uses the Prisma adapter.
- Establishes the role source of truth for future admin-only features such as role management UI, all-user file views, UploadThing site settings, database backups, and moderation workflows.
- Requires local database migration validation and manual first-admin assignment instructions after deployment.

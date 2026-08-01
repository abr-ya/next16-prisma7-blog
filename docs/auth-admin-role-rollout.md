# Auth Admin Role Rollout

Feature: `feature-017-auth-admin-plugin-role-storage`

## Role Storage

Better Auth Admin plugin role storage is backed by the project PostgreSQL database through Prisma.

- Ordinary users use the `user` role.
- Administrators use the `admin` role.
- Existing users are defaulted to `user` by the Prisma migration.
- New users are defaulted to `user` by the Prisma schema and Better Auth Admin plugin configuration.
- The deferred `editor` role is not active in this slice.

## First Admin Promotion

The first administrator is promoted manually after the migration is applied.

Prisma Studio option:

1. Run `npx prisma studio`.
2. Open the `User` table.
3. Find the intended administrator.
4. Set `role` to `admin`.
5. Save the row.

SQL option:

```sql
UPDATE "user"
SET "role" = 'admin'
WHERE "email" = 'admin@example.com';
```

Replace `admin@example.com` with the real administrator email.

## Intentional Non-Goals

This slice does not add `INITIAL_ADMIN_EMAIL` bootstrap behavior and does not automatically promote the first registered user.

This slice also does not add project UI for Better Auth Admin plugin user-management capabilities such as user creation, banning, unbanning, impersonation, deletion, password setting, email setting, session revocation, or broad user management.

`/admin` remains an authenticated creator workspace. Future sensitive operations should call server-side role helpers such as `requireAdmin()` instead of making the entire admin layout administrator-only.

# Proposal

## Why

Administrators need a safe, centralized way to see the accounts in the workspace. The earlier account-trust plan coupled this visibility with status mutations and resource aggregates, making the feature unnecessarily broad; this slice delivers the read-only foundation first.

## What Changes

- Add an administrator-only `/admin/users` page that lists user accounts with pagination and email search.
- Show each row's name, email, registration date, role, current trust status, and linked sign-in methods as read-only data.
- Add the Users destination to the administrator navigation.
- Keep the page server-authorized and ensure no user list data is exposed to ordinary users or anonymous visitors.
- Defer trust-status changes, resource counts, photo-like totals, audit-history display, and broader account-management actions to separately planned follow-ups.

## Capabilities

### New Capabilities

- `account-trust-admin-users`: Administrator-only, read-only account directory with paginated email search and trust-status visibility.

### Modified Capabilities

- None.

## Impact

- Affected routes: new `/admin/users` page and administrator sidebar navigation.
- Affected data: read-only queries over existing `User` fields (`name`, `email`, `createdAt`, `role`, `trustLevel`) and linked `Account.providerId` values; no schema or migration changes.
- Affected surfaces: administrator workspace only; public and ordinary-user behavior remains unchanged.

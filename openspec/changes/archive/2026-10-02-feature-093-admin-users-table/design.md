# Design

## Context

See `proposal.md` for motivation and `specs/account-trust-admin-users/spec.md` for the behavior contract. The application already has an `/admin` shell, a server-side `requireAdmin` route guard, a distinct administrator-control sidebar section, and `User` already stores every field required by this slice. No current `/admin/users` route or user-directory data helper exists.

## Goals / Non-Goals

**Goals:**

- Read user-directory data through a minimal, server-only, administrator-authorized query.
- Keep search and pagination URL-driven so results are shareable within the authorized workspace and do not require loading every user into the browser.
- Reuse the existing admin page layout, table primitives, badges, and navigation pattern.

**Non-Goals:**

- No Prisma schema change, migration, mutation action, or trust audit write.
- No resource/like aggregate query, user detail view, bulk operation, role management, or trust-status management.
- No change to account trust gates, quotas, or public account visibility.

## Decisions

### Server-side directory query with bounded pagination

Create a server-only user-directory query that calls the existing administrator guard and selects only `id`, `name`, `email`, `createdAt`, `role`, `trustLevel`, and linked `Account.providerId` values. It will accept normalized email-search and page inputs, order results deterministically, return the requested page plus total pagination metadata, and constrain invalid or out-of-range page values to a safe page.

This prevents a browser payload containing every account and avoids exposing fields such as sessions, account tokens, bans, audit rows, or related resources. Provider IDs are sufficient for human-readable sign-in-method labels and do not expose OAuth credentials. A client-side table over all users was considered because it matches several existing admin tables, but it does not scale or minimize administrative data exposure as well.

### Route-owned URL state and presentational client table

`/admin/users` will remain a server page guarded before it reads directory rows. It will parse `page` and email search query parameters, request the matching page, and render a small client-side table/search control for interaction and navigation. Search submission and pagination links will preserve the current search state in the URL.

This follows the public list pattern for URL state while keeping authorization and database reads on the server. A server action was rejected because this slice is read-only and a URL form/link flow gives navigation, refresh, and empty-state behavior without mutation endpoints.

### Navigation follows existing administrator-control visibility

Add Users to `administratorControlItems` only. The existing admin-shell role calculation determines whether this section is rendered; the route independently invokes `requireAdmin`, so hiding the link is never the authorization mechanism.

### Read-only representation of trust and role

The table will use descriptive labels/badges for persisted role and trust values but will provide no interactive control. This lets administrators see the trust rollout state while leaving mutations to a later, separately specified change.

### Multiple sign-in methods rather than a primary provider

The table will render a read-only badge for every distinct linked `Account.providerId`. It will map the currently supported `credential`, `google`, and `github` values to Email/password, Google, and GitHub, and retain a safe fallback label for an unexpected provider. Selecting a single provider was rejected because Better Auth can link multiple account rows to one user and a primary-method rule would hide valid account state.

## Risks / Trade-offs

- [Email search can be slow without an appropriate database plan as the account table grows] → Keep the query narrowly selected, use a bounded page size, and inspect existing unique-email/index behavior before adding any new index; this initial slice does not alter the schema.
- [Role/trust labels can drift from enum values] → Centralize display mapping in the user-directory UI and retain a safe fallback label for unexpected persisted values.
- [Sidebar visibility could be mistaken for protection] → Guard both the route and its data helper with existing administrator authorization.
- [A later management feature may need more data] → Keep the row shape deliberately narrow; later slices can add separately reviewed aggregates or mutation-specific reads without widening this list by default.

## Migration Plan

1. Deploy the route, data helper, table, and administrator navigation entry together; no migration is required.
2. Roll back by removing the route and sidebar entry. The change writes no user data, so rollback does not need data recovery.

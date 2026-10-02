# Tasks

## 1. Protected directory data

- [x] 1.1 Add a server-only, administrator-authorized user-directory query that selects only the specified read-only user fields, applies normalized email search, uses deterministic ordering and bounded pagination, and returns page metadata; verify with `npm run tsc`.
- [x] 1.2 Review the directory query's normalized search/page handling and minimal selected shape; defer expanded matching, empty, and invalid-page coverage to a later test-focused follow-up.
- [x] 1.3 Extend the read-only directory row query with linked `Account.providerId` values only; verify the selected shape contains no account credentials or tokens.

## 2. Administrator directory surface

- [x] 2.1 Create the guarded `/admin/users` server page using the existing admin layout and URL-driven `page`/email-search inputs; verify anonymous and ordinary-user direct requests are denied before rows render.
- [x] 2.2 Create the read-only user table with name, email, registration date, role, trust-status representation, email search, pagination, and a clear no-results state; verify no status/role mutation, aggregate-statistics, or audit-history control is rendered.
- [x] 2.3 Add the Users entry to the administrator-only sidebar group; verify it is visible to an administrator and absent for an ordinary user.
- [x] 2.4 Add a read-only sign-in-method column that renders every distinct linked provider with supported labels and an unknown-provider fallback; verify an account with multiple providers shows multiple labels.

## 3. Validation and handoff

- [x] 3.1 Run `npm run tsc` and targeted ESLint for every changed file (including files outside `app`); resolve reported errors.
- [x] 3.2 Manually confirm the administrator `/admin/users` table renders, including the sign-in-method column; confirmed by the user on 2026-10-02. Defer broader browser coverage and local production build to a later follow-up.
- [x] 3.3 Update the OpenSpec task checklist and relevant backlog/history records to reflect the implemented read-only slice and defer trust-status mutation and resource-statistics work as separate candidates.

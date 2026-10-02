# Tasks

## 1. Protected directory data

- [ ] 1.1 Add a server-only, administrator-authorized user-directory query that selects only the specified read-only user fields, applies normalized email search, uses deterministic ordering and bounded pagination, and returns page metadata; verify with `npm run tsc`.
- [ ] 1.2 Add focused coverage or a reproducible query-level verification for matching, empty, and invalid/out-of-range pagination inputs without returning account/session/audit/resource data.

## 2. Administrator directory surface

- [ ] 2.1 Create the guarded `/admin/users` server page using the existing admin layout and URL-driven `page`/email-search inputs; verify anonymous and ordinary-user direct requests are denied before rows render.
- [ ] 2.2 Create the read-only user table with name, email, registration date, role, trust-status representation, email search, pagination, and a clear no-results state; verify no status/role mutation, aggregate-statistics, or audit-history control is rendered.
- [ ] 2.3 Add the Users entry to the administrator-only sidebar group; verify it is visible to an administrator and absent for an ordinary user.

## 3. Validation and handoff

- [ ] 3.1 Run `npm run tsc` and targeted ESLint for every changed file (including files outside `app`); resolve reported errors.
- [ ] 3.2 Ask for or perform local `npm run build` validation and a browser check covering default list, email search, pagination, empty state, administrator access, and direct denial for ordinary/anonymous visitors.
- [ ] 3.3 Update the OpenSpec task checklist and relevant backlog/history records to reflect the implemented read-only slice and defer trust-status mutation and resource-statistics work as separate candidates.

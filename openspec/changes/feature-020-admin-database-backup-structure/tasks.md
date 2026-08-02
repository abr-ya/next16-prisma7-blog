## 1. Planning Contract

- [x] 1.1 Review the accepted auth role specs and confirm database backups depend on the persisted `admin` role.
- [x] 1.2 Review current Prisma models and identify the data domains that a full database backup contract must account for.
- [x] 1.3 Confirm the structure slice excludes live backup generation, download, scheduling, retention, restore, and provider-file binary export.

## 2. Backup Structure

- [x] 2.1 Define the admin-only route/action boundary for future backup controls.
- [x] 2.2 Define full backup scope and partial backup scope expectations.
- [x] 2.3 Define backup artifact metadata and restore-compatibility disclosure.
- [x] 2.4 Define audit expectations for backup generation and backup download.
- [x] 2.5 Define restore boundaries and future restore preflight expectations.
- [x] 2.6 Add an admin-only `/admin/database` structure page that renders the backup contract without executable backup or restore controls.
- [x] 2.7 Hide the admin database navigation item from ordinary authenticated users while keeping server-side role enforcement on the page.

## 3. Roadmap And Backlog

- [x] 3.1 Update `openspec/backlog.md` so `feature-020-admin-database-backup-structure` reflects the active work state.
- [x] 3.2 Identify follow-up implementation slices for manual backup generation, backup retention/storage policy, and restore behavior when needed.

## 4. Validation

- [x] 4.1 Run `openspec validate feature-020-admin-database-backup-structure --strict`.
- [x] 4.2 Run `openspec list --json` and confirm the active change appears without conflicting with `feature-033-blog-post-detail-tags-links`.
- [x] 4.3 Run `git diff --check`.
- [x] 4.4 Run `npm run tsc`.
- [x] 4.5 Run targeted ESLint for `app/admin/database/page.tsx`, `app/admin/layout.tsx`, `components/admin-pages/admin-sidebar.tsx`, and any new backup contract helper.
- [x] 4.6 Run `npm run lint`.
- [x] 4.7 Ask for `npm run build` local validation if routing validation is needed beyond static checks.

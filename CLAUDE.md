# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog/content hub built with Next.js 16 App Router, TypeScript, React 19, Prisma 7, PostgreSQL, better-auth, Tailwind CSS 4, and UploadThing. Supports blog posts, markdown documentation, video content with bookmarks/comments, and file management.

## Commands

**Development:**
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build the application
npm run start        # Start production build
```

**Validation:**
```bash
npm run tsc          # TypeScript type checking
npm run lint         # ESLint on app/**/*.{js,ts,tsx}
npm run fix          # ESLint auto-fix on app/**/*.{js,ts,tsx}
```

**Prisma:**
```bash
npx prisma generate  # Regenerate Prisma client (also runs on npm postinstall)
npx prisma migrate dev  # Create and apply migrations
```

**Notes:**
- No dedicated test suite exists currently.
- Root lint script only checks `app/` directory. For files in `components/`, `lib/`, etc., run targeted ESLint: `npx eslint <path> --quiet`
- Generated Prisma client lives in `generated/prisma` and is auto-regenerated on `npm install`.

## Architecture

**Directory Structure:**
- `app/` — Next.js App Router pages and route handlers
  - `app/_data/` — Database query helpers (posts, videos, docs, links, files, etc.)
  - `app/_interfaces/` — TypeScript interfaces
  - `app/admin/` — Admin-only pages
  - `app/api/auth/` — better-auth routes
  - `app/api/uploadthing/` — UploadThing file upload routes
  - `app/blog/`, `app/docs/`, `app/videos/` — Public content pages
- `components/` — React components
  - `components/admin-pages/` — Admin CRUD tables, dialogs, forms
  - `components/blog-pages/`, `components/docs/`, `components/video-pages/` — Public content UI
  - `components/common/` — Shared rich text and table building blocks
  - `components/layout/` — Reusable layout components
  - `components/ui/` — shadcn-style UI primitives (Button, Dialog, Select, etc.)
- `lib/` — Shared application utilities
  - `lib/prisma.ts` — Prisma client instance
  - `lib/auth.ts`, `lib/auth-client.ts`, `lib/auth-utils.ts` — Authentication setup (better-auth)
  - `lib/uploadthing.ts` — UploadThing helpers
  - `lib/video-providers/` — Video provider metadata extraction (YouTube, Vimeo, etc.)
- `prisma/` — Prisma schema and migrations
- `generated/prisma/` — Generated Prisma client (do not edit manually)
- `docs/` — Project documentation, implementation plans, reports
- `openspec/` — OpenSpec workflow artifacts (config, changes, specs)

**Key Patterns:**
- Server/client boundary: Data access stays in server components/actions/`app/_data` helpers. Client interactivity lives in `"use client"` components.
- Prisma client is generated to `generated/prisma` and imported via `lib/prisma.ts`.
- Authentication uses better-auth with admin plugin. Roles defined in `lib/auth-roles.ts`.
- File uploads use UploadThing with two routes: `imageUploader` (legacy, open access) and `fileUploader` (authenticated, with storage limits tracked in `FileAsset` model).
- Admin pages live under `/admin` route and `components/admin-pages`.
- Public visibility rules are explicit, especially for videos (`VideoVisibility`) and video channels (`VideoChannelVisibility`).

**Database Models (Prisma):**
- `User`, `Session`, `Account`, `Verification` — Auth (better-auth schema)
- `MdDoc` — Markdown documentation pages
- `Post`, `PostImage`, `Category` — Blog posts with Tiptap rich text
- `Video`, `VideoChannel`, `VideoTag`, `VideoBookmark`, `Comment` — Video content with bookmarks/comments
- `Link` — URL shortener/links
- `FileAsset` — Uploaded files with purpose/visibility/status tracking
- `Log` — Activity logging

## Development Workflow

**OpenSpec Methodology:**

This project uses OpenSpec for change planning across five independent numbering pools. Each pool has its own backlog and (where applicable) archive:

- `feature-XXX` — product features and user-visible behavior changes. Backlog: `openspec/backlog.md`. Archive: `openspec/feature-history.md`.
- `fix-XXX` — bug fixes, paired with the originating change in the summary. Backlog: `openspec/backlog.md`.
- `verify-XXX` — automated verification scripts with isolated schema, seed factories, and explicit error-code assertions. Backlog: `openspec/backlog.md`.
- `refactor-XXX` — internal code-hygiene changes with **no** user-visible behavior change. Backlog: `openspec/refactor-backlog.md`. Archive: `openspec/refactor-history.md`.
- `research-XXX` — investigation outputs with no code change (for example shared-pattern audits). Backlog: `openspec/research-backlog.md`. Archive: `openspec/research-history.md`.

**Hybrid rule:** if a change exposes *any* user-visible behavior change it belongs under `feature-XXX` regardless of how much internal cleanup it also does — the refactor rides inside. Conversely, a `refactor-XXX` change must leave observable behavior unchanged.

**Workflow per pool:**

1. Read `openspec/config.yaml` for project context.
2. Read the pool's backlog file for the next available number.
3. Create OpenSpec artifacts under `openspec/changes/<pool>-XXX-area-action/` — `proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md` when applicable. `refactor-XXX` and `research-XXX` changes omit `specs/` (no behavior change). For `research-XXX`, `design.md` describes the investigation method (scope, evidence standard, findings rubric, required output structure), `tasks.md` is the investigation checklist that fixes the write-up's required sections before the read begins, and the result itself lives in `output.md`.
4. Implement per accepted tasks.
5. Update docs/checklists when behavior changes; archive on completion via the OpenSpec archive skill.
6. **Before archiving, report the open tasks.** If any task in the change's `tasks.md` is still unchecked, tell the user explicitly which ones are open (and where they are tracked, e.g. a follow-up row in the pool backlog) and wait for their go-ahead. Do not pass `--yes` to skip the CLI's own incomplete-task warning — that flag is not the user's consent, and a warning printed inside CLI output is not a report the user has seen.

Numbering format: `<pool>-<3 digits>-<area>-<short-action>` (for example `feature-024-public-file-downloads`, `refactor-001-tracks-admin-panel-split`, `research-001-tracks-admin-panel-parallel-audit`). Use the same name for the OpenSpec change directory and the git branch. Do not reuse numbers in the same pool.

Small obvious fixes that don't change product scope, public behavior, data contracts, or architecture may be implemented directly.

**Validation Workflow:**

Before completing a change:
1. Run `npm run tsc` to verify TypeScript
2. Run `npm run lint` (or targeted ESLint for non-app files)
3. For route/behavior/schema changes, run or ask user to run `npm run build`
4. For UI changes, manually test in browser

For Prisma schema changes: validate schema, run `npx prisma generate`, and carefully review migration impact.

## Code Conventions

- TypeScript throughout
- Component files: kebab-case filenames, PascalCase exported components
- Use explicit domain names: `video`, `video-channel`, `md-doc`, `post`, `category`, `link`, `file-asset`
- Reuse existing UI primitives from `components/ui` before adding new ones
- Use lucide-react for icons
- Keep changes scoped to requested capability — avoid broad refactors during feature work

## Safety Rules

- Do not reset database or rewrite migrations unless explicitly requested
- Do not edit `generated/prisma` manually
- Preserve existing data and user changes in working tree
- Keep public visibility rules explicit
- Keep admin workflows under `/admin` and authenticated routes
- Avoid new dependencies unless they reduce implementation risk or match project direction

## Token Economy

- Prefer targeted reads over broad scans
- For broad multi-file exploration (mapping visibility rules across many files, locating a pattern across the repo, finding all references to a domain), delegate to the **Explore** subagent with a focused brief — do not fan out reads yourself
- Use `rg`, `find`, `sed` with exact paths
- Do not re-read large files, `node_modules`, `.next`, or `generated/prisma` unnecessarily
- Summarize findings briefly before editing
- For large output (full builds, test suites), ask user to run locally and paste result

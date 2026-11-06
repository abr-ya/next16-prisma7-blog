# Agent Instructions

## Project Context

This project is a personal blog/content hub built with Next.js App Router, TypeScript, React, Prisma 7, PostgreSQL, better-auth, Tailwind CSS, Radix/shadcn-style UI primitives, UploadThing, and Tiptap.

Read `openspec/config.yaml` for the durable project context: stack, architecture, naming conventions, module layout, testing approach, constraints, and commands. Read `prisma/schema.prisma` for the data model. Both are the source of truth for reference material — do not copy their content into this file.

Write repository files (docs, code, comments, commit messages) in English unless explicitly asked otherwise.

## OpenSpec Workflow

We work with OpenSpec.

For non-trivial feature work, behavior changes, schema changes, route changes, or architecture changes:

- Start from the live repository state.
- Inspect `openspec/config.yaml` first.
- Check active OpenSpec changes/specs when they exist.
- Before a large or multi-file change, propose a short plan and get the user's go-ahead before implementing.
- Create or update OpenSpec proposal/design/tasks/spec artifacts before implementation when the scope is not already explicitly approved.
- After preparing OpenSpec artifacts, explicitly tell the user that the spec is ready before starting implementation.
- Keep code changes aligned with the accepted OpenSpec tasks.
- Update docs/checklists together with behavior changes when the project already tracks the feature in docs.
- Before archiving a change, report any unchecked tasks in its `tasks.md` and wait for the user's go-ahead. Do not pass `--yes` to silence the CLI's incomplete-task warning: a warning printed by the CLI is not a report the user has seen.

If the developer asks to bypass or violates the OpenSpec methodology, say so explicitly and get clear confirmation before continuing outside the OpenSpec flow.

Small obvious fixes may be implemented directly when they do not change product scope, public behavior, data contracts, or architecture. Mention when a fix is being treated as small and outside a formal OpenSpec change.

## Numbering Pools

Five independent pools, each with its own backlog and archive. Check the pool files before assigning a number.

| Pool | Use for | Backlog | Archive |
| --- | --- | --- | --- |
| `feature-XXX` | Product features and any user-visible behavior change | `openspec/backlog.md` | `openspec/feature-history.md` |
| `fix-XXX` | Documented bug fixes | `openspec/backlog.md` (Fixes section) | `openspec/feature-history.md` (Fix History section) |
| `verify-XXX` | Automated verification scripts with isolated schema, seed factories, and explicit error-code assertions | `openspec/backlog.md` | — |
| `refactor-XXX` | Internal code hygiene with no user-visible behavior change | `openspec/refactor-backlog.md` | `openspec/refactor-history.md` |
| `research-XXX` | Investigation output with no code change | `openspec/research-backlog.md` | `openspec/research-history.md` |

Format:

`<pool>-<3 digits>-<area>-<short-action>`

Examples:

- `feature-001-video-admin-table-pagination`
- `fix-001-admin-post-save-enable`
- `refactor-001-delete-row-confirm`
- `research-001-tracks-admin-panel-parallel-audit`

Rules:

- Backlog candidates stay unnumbered until they are promoted; promotion assigns the lowest unused number in that pool.
- Use the same numbered name for the OpenSpec change directory and the git branch when possible.
- Mark the promoted row as `In Progress` in the pool's backlog file.
- Completed entries keep their numbers permanently in the pool's history file; do not reuse a number.
- Cancelled or deferred candidates return to the unnumbered pool and do not reserve a number.
- Hybrid rule: a change that exposes any user-visible behavior change belongs under `feature-XXX`, even when it also cleans up code. A `refactor-XXX` change must leave observable behavior unchanged.

Artifacts: `proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md` when applicable. `refactor-XXX` and `research-XXX` omit `specs/` (no behavior change). `research-XXX` writes its findings to `output.md`, and its `design.md` describes the investigation method.

Small obvious fixes may still be implemented directly without a numbered change when they do not change product scope, public behavior, data contracts, or architecture. Say so when a fix is treated that way.

## Commit Messages

Use product or code area scopes in commit messages, not workflow/tooling scopes that apply to the whole project.

- Prefer scopes such as `localization`, `public-nav`, `videos`, `admin`, `auth`, `docs`, or `content-tags`.
- Do not use `openspec` as the scope merely because the change edits OpenSpec artifacts; this project uses OpenSpec throughout, so that scope adds little signal.
- Example: prefer `docs(localization): propose feature-039 public navbar language switcher` over `docs(openspec): ...`.
- Start the commit subject after the colon with a capital letter (for example, `docs(localization): Propose feature-039 public navbar language switcher`).

Never commit without the user's explicit go-ahead. Prepare the change, show the diff summary and the proposed message, and ask a question that can be answered with a yes or a correction. Do not stage and commit silently, even when the change is small or was already discussed.

## Final Feature Summary

After a feature's spec is synced and the change is archived, finish the final summary with 4–5 sentences in English describing what the feature does for the user. Keep this English recap in the chat reply, not in a repository file.

## Token Economy

Spend tokens deliberately.

- Prefer targeted reads over broad repository scans; read only the files relevant to the current task.
- Use `rg`, `find`, `sed`, and exact file paths to inspect only the smallest useful set of files. If `rg` is unavailable in the environment, fall back to `grep -rn` instead of retrying.
- Do not re-read large files or generated files unless needed.
- Summarize findings briefly before editing.
- Keep plans short unless the user asks for a detailed plan or the scope is ambiguous.
- Work in small, reviewable slices and report only the useful evidence.
- Avoid dumping long command output into chat; summarize the important lines.
- Do not inspect `node_modules`, `.next`, `generated/prisma`, or large lock/build artifacts unless there is a specific reason.
- Never read `openspec/backlog.md` (~87 KB) or `openspec/feature-history.md` (~74 KB) end to end; locate the relevant row with a targeted search such as `rg -n 'feature-126'` and read only that line.
- For broad multi-file exploration (mapping a rule across many files, finding repo-wide references to a domain), delegate to the `explore` subagent with a focused brief instead of fanning out reads.
- Keep responses concise: state the outcome and the evidence, not a narration of every step taken.

For commands with potentially large output, ask the user to run them and paste the result when that is more token-efficient or when the sandbox is likely to distort the result. This especially applies to full builds, full test suites, verbose logs, and long OpenSpec validation output.

When asking the user to run a command, provide the exact command and say what result is needed.

## Repository Reports

For a period report of merged numbered changes, start with:

`node scripts/report-merged-features.mjs --since 2026-10-01 --until 2026-10-31 --out docs/merged-features-2026-10.md`

It defaults to `feature` merges from `origin/master`; use `--kinds all` for every pool and `--ref` for another branch. The generated descriptions are drafts extracted from archived proposals — review and shorten them before committing.

## Validation Commands

Preferred checks:

- `npm run tsc`
- `npm run lint`
- `npm run build` for routing, Prisma, or user-facing behavior changes when feasible
- `npm run dev` for browser/manual checks when a running app is needed

Notes:

- Run only the checks relevant to the change; skip suites that cover untouched areas.
- There is currently no dedicated `npm test` script.
- `npm run fix` applies ESLint auto-fix to `app/**`; `npx prisma generate` regenerates the client after schema changes (it also runs on `npm install`), and `npx prisma migrate dev` creates and applies a migration.
- The root lint script checks `./app/**/*.{js,ts,tsx}` only. For changed files under `components`, `lib`, or other folders, run targeted ESLint such as `npx eslint components/admin-pages/videos-table.tsx --quiet`.
- When `npm run dev` is needed for manual/browser validation, ask the user to run it locally and report the URL/result instead of starting it in the sandbox.
- When `npm run build` is needed, ask the user to run it locally and paste the result instead of running it in the sandbox. The sandbox can fail on restricted network access for Next/Google font fetches, and the user prefers to perform build validation locally.
- For Prisma/schema changes, validate the schema and regenerate the client with the existing project flow. Do not edit generated Prisma client files manually.
- For UI-heavy changes, include a manual browser check expectation; static checks are not enough.

## Repo Safety

- Do not reset database state unless explicitly requested.
- Do not rewrite or delete migrations unless explicitly requested.
- Do not edit `generated/prisma` manually.
- Preserve user changes in the working tree.
- Keep changes scoped to the requested capability.
- Do not refactor unrelated code, even where the surrounding code would look cleaner.
- Do not create documentation unless it is requested or the OpenSpec workflow already requires it.
- Avoid new dependencies unless they clearly reduce implementation risk or match existing project direction.

## Prisma Migration Integrity

- Treat a migration recorded as applied in Prisma as immutable: do not reformat it or add explanatory comments, because Prisma checks the exact SQL checksum.
- Put later schema corrections in a new forward migration, never by editing an applied one.
- On migration checksum drift, do not run `prisma migrate reset`. First compare `_prisma_migrations.checksum` with candidate SQL in read-only mode and restore the exact applied content when it is known; preserve production/development data and resolve history deliberately.

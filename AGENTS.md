# Agent Instructions

## Project Context

This project is a personal blog/content hub built with Next.js App Router, TypeScript, React, Prisma 7, PostgreSQL, better-auth, Tailwind CSS, Radix/shadcn-style UI primitives, UploadThing, and Tiptap.

Read `openspec/config.yaml` for the durable project context: stack, architecture, naming conventions, module layout, testing approach, constraints, and commands.

## OpenSpec Workflow

We work with OpenSpec.

For non-trivial feature work, behavior changes, schema changes, route changes, or architecture changes:

- Start from the live repository state.
- Inspect `openspec/config.yaml` first.
- Check active OpenSpec changes/specs when they exist.
- Create or update OpenSpec proposal/design/tasks/spec artifacts before implementation when the scope is not already explicitly approved.
- Keep code changes aligned with the accepted OpenSpec tasks.
- Update docs/checklists together with behavior changes when the project already tracks the feature in docs.

If the developer asks to bypass or violates the OpenSpec methodology, say so explicitly and get clear confirmation before continuing outside the OpenSpec flow.

Small obvious fixes may be implemented directly when they do not change product scope, public behavior, data contracts, or architecture. Mention when a fix is being treated as small and outside a formal OpenSpec change.

## Feature Numbering

Use one project-wide sequence for active and completed numbered features. Backlog candidates do not receive a `feature-XXX` number until they are promoted into implementation.

Format:

`feature-<3 digits>-<area>-<short-action>`

Examples:

- `feature-001-video-admin-table-pagination`
- `feature-002-video-public-channel-filter`
- `feature-003-blog-post-search`
- `feature-004-md-docs-editor-polish`

When promoting a backlog candidate:

- Check `openspec/backlog.md` and `openspec/feature-history.md` for existing numbered features.
- Assign the lowest unused `feature-XXX` number.
- Use the same numbered name for the OpenSpec change directory and the git branch when possible.
- Mark the row as `In Progress` in `openspec/backlog.md`.

Completed features keep their numbers permanently in `openspec/feature-history.md`.
Cancelled or deferred ideas should return to the unnumbered candidate pool unless already completed; cancelled candidates do not reserve feature numbers.

## Token Economy

Spend tokens deliberately.

- Prefer targeted reads over broad repository scans.
- Use `rg`, `find`, `sed`, and exact file paths to inspect only the smallest useful set of files.
- Do not re-read large files or generated files unless needed.
- Summarize findings briefly before editing.
- Keep plans short unless the user asks for a detailed plan or the scope is ambiguous.
- Work in small, reviewable slices and report only the useful evidence.
- Avoid dumping long command output into chat; summarize the important lines.
- Do not inspect `node_modules`, `.next`, `generated/prisma`, or large lock/build artifacts unless there is a specific reason.

For commands with potentially large output, ask the user to run them and paste the result when that is more token-efficient or when the sandbox is likely to distort the result. This especially applies to full builds, full test suites, verbose logs, and long OpenSpec validation output.

When asking the user to run a command, provide the exact command and say what result is needed.

## Validation Commands

Preferred checks:

- `npm run tsc`
- `npm run lint`
- `npm run build` for routing, Prisma, or user-facing behavior changes when feasible

Notes:

- There is currently no dedicated `npm test` script.
- The root lint script checks `./app/**/*.{js,ts,tsx}` only. For changed files under `components`, `lib`, or other folders, run targeted ESLint such as `npx eslint components/admin-pages/videos-table.tsx --quiet`.
- When `npm run build` is needed, ask the user to run it locally and paste the result instead of running it in the sandbox. The sandbox can fail on restricted network access for Next/Google font fetches, and the user prefers to perform build validation locally.
- For Prisma/schema changes, validate the schema and regenerate the client with the existing project flow. Do not edit generated Prisma client files manually.
- For UI-heavy changes, include a manual browser check expectation; static checks are not enough.

## Repo Safety

- Do not reset database state unless explicitly requested.
- Do not rewrite or delete migrations unless explicitly requested.
- Do not edit `generated/prisma` manually.
- Preserve user changes in the working tree.
- Keep changes scoped to the requested capability.
- Avoid new dependencies unless they clearly reduce implementation risk or match existing project direction.

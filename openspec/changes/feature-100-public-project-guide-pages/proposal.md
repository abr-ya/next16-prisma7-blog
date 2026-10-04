# Proposal

## Why

Visitors currently have navigation to individual content areas but no concise public explanation of the project, what each area is for, or how account trust levels affect participation. A small, discoverable guide makes the site easier to understand without turning product copy into a duplicate of the content listings.

## What Changes

- Add a public project-guide overview at `/about` that introduces the site and links to the account-level guide and existing public content destinations.
- Add `/about/account-levels` to explain the `new`, `verified`, `trusted`, and `restricted` account levels, their participation boundaries, and the promotion or administrator-review paths that are actually enforced when this feature ships.
- Add a discoverable public-navigation entry point to the guide while preserving existing primary section links and authenticated-menu behavior.
- Provide static guide copy through the existing public locale structure, initially in English and Russian.

## Capabilities

### New Capabilities

- `public-project-guide`: Public project-guide overview and account-level explanation with safe links to existing public destinations.

### Modified Capabilities

- `public-navigation`: Add a discoverable guide destination without changing the existing primary public section targets or authentication-aware controls.

## Impact

- Affected public routes: `/about` and `/about/account-levels`.
- Affected public surface: shared public navbar and locale resources; no administrator surface, API, Prisma model, migration, or dependency change is expected.
- Account-level copy must be derived from the enforced trust-policy behavior at implementation time, so this feature follows the trust-gate and quota slices rather than becoming a policy source of truth.

## Non-goals

- Changing account trust rules, quotas, promotions, roles, or administrator controls.
- Translating database-backed posts, documents, videos, trips, tracks, or comments.
- Duplicating section listing, search, filtering, or management interfaces inside guide pages.
- Creating a general CMS or editable documentation workflow for the guide content.
- Adding section-specific orientation pages; those land in follow-up guide slices.

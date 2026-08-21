## Context

The current home page renders `HeroSection`, `AboutSection`, and recent markdown docs. `HeroSection` contains stale copy that splits links into "Actual blog, version 2.0" and "old (v1.0) Comments". The open public content routes are `/blog`, `/videos`, `/docs`, and `/comments`; `/comments` currently exists but is still placeholder-level.

## Goals / Non-Goals

**Goals:**

- Make the first home screen a compact content hub for the four public content areas.
- Keep the home page copy in English.
- Preserve a visible but secondary `/admin` entry point.
- Keep the change scoped to presentational home page work plus OpenSpec backlog bookkeeping.

**Non-Goals:**

- No Prisma schema, migration, auth, or data access changes.
- No implementation of localization, language routing, or translated page content.
- No implementation of the standalone comments feed.
- No authorization change for `/admin`; the existing admin route remains responsible for access control.

## Decisions

- Use small linked cards for public content sections instead of plain paired buttons.
  - Rationale: cards can carry both the destination and a short description without turning the hero into a dense button row.
  - Alternative considered: keep only buttons. This would solve stale labels but would not provide enough context for "Video Links" and "Markdown Documents".

- Keep the content hub data local to the home hero component.
  - Rationale: the links are static presentation data for one screen, and a shared abstraction would be premature.
  - Alternative considered: add a shared navigation config. That is better deferred until localization or multi-surface navigation needs the same metadata.

- Mark Comments as work in progress directly in its card.
  - Rationale: `/comments` exists publicly but is placeholder-level; the home page should stay honest while keeping the planned section discoverable.
  - Alternative considered: hide Comments until finished. That would make the public content map less complete and conflicts with the requested link order.

- Keep the admin dashboard link separate and visually secondary.
  - Rationale: the home page is public-content-first, but the owner still wants quick admin access.
  - Alternative considered: include Admin as a fifth primary card. That would mix private workflow with the public content hierarchy.

## Risks / Trade-offs

- The Comments card may attract visitors to an unfinished page -> Mitigate by labeling it as work in progress and tracking `public-comments-unified-feed` in backlog.
- Static English labels will need revisiting during localization -> Mitigate by tracking `public-navbar-language-switcher` as a separate backlog candidate.
- Admin visibility on a public page can imply public access -> Mitigate by making it secondary and leaving actual authorization to existing admin route protections.

## Migration Plan

No data migration is required. Rollback is a normal code revert of the home page component and OpenSpec backlog edits.

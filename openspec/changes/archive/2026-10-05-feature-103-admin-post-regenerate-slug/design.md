# Design

## Context

`PostForm` is a client component shared by the administrator's create and edit post routes. It already imports the shared `createSlug` helper and fills an empty slug after the title input loses focus. Post creation and updates continue through existing server actions, and `Post.slug` has a database uniqueness constraint.

See `proposal.md` and `specs/admin-post-slug-regeneration/spec.md` for the product outcome and behavior contract.

## Goals / Non-Goals

**Goals:**

- Make the title-derived slug generation a deliberate, visible form action.
- Preserve the form's existing React Hook Form validation and dirty-state behavior.
- Leave persistence, authorization, and uniqueness enforcement in the existing server actions and database constraint.

**Non-Goals:**

- No server action, schema, migration, collision-suffix generation, or redirect mechanism.
- No rollout of the control to tracks, trips, MD docs, or other slug-bearing forms.

## Decisions

### Keep regeneration inside the shared client form

The control will call the already-used `createSlug` helper with the form's current title and set the slug value with validation and dirty-state options. This exposes the generated candidate before save and makes it usable on both routes without a network request.

Alternative considered: a server-side slug suggestion endpoint. Rejected because generation is deterministic, requires no database read, and must not persist anything until the normal form submission.

### Guard empty generated values

The handler will leave the current slug untouched when the title does not yield a non-empty slug. Existing schema validation remains responsible for preventing invalid form submission.

Alternative considered: clearing the slug. Rejected because it would discard a valid manually entered value and create an avoidable invalid form state.

### Retain the existing save boundary

Regeneration changes only in-memory form state. Existing create/update actions retain authentication and owner-or-administrator authorization; the database remains the final authority for duplicate slugs. No public-page behavior changes until a successful normal save.

Alternative considered: checking uniqueness as the control is pressed. Rejected because it adds a partial validation path without removing the authoritative save-time race condition.

## Risks / Trade-offs

- [Generated title maps to an existing slug] → Show the candidate in the form and rely on the current authoritative save-time uniqueness outcome; do not imply availability.
- [Administrator accidentally overwrites a custom slug] → Require an explicit control activation and do not regenerate on title edits.
- [Title produces no usable slug] → Keep the existing slug and retain current validation feedback.

## Migration Plan

Deploy as a client-form-only change. No data migration or backfill is needed. Rollback consists of removing the control; existing stored slugs and public URLs are unaffected.

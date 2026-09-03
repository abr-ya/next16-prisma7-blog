## Context

The project already has published hike listing/detail routes under `/hikes` and `/hikes/[slug]`, plus shared public navigation and a home page content hub. A later backlog candidate tracks the larger `Hike` to `Trip` domain rename, including routes, models, actions, specs, and data-preserving migrations.

## Goals / Non-Goals

**Goals:**

- Add Trips discoverability to the home page and shared public navbar.
- Use the new public-facing Trips label now while keeping the current `/hikes` target route.
- Keep the temporary label/route mismatch explicit and easy to remove during the later domain rename.

**Non-Goals:**

- No Prisma schema, migration, data model, server action, helper, admin route, or public route folder rename.
- No `/trips` route or redirect behavior in this slice.
- No trip category/type model changes.

## Decisions

- Add `Trips` as a public label that links to `/hikes`.
  - Rationale: this makes the outdoor trip content discoverable now and lets the UI vocabulary move in the intended direction without risky domain churn.
  - Alternative considered: wait for the full `Hike` to `Trip` rename. That keeps naming pure but leaves the existing outdoor pages less discoverable.

- Keep `Photo` and trip category planning separate from this navigation slice.
  - Rationale: photo reuse and category management affect data modeling and admin workflows, while this slice is only public navigation copy and links.
  - Alternative considered: bundle trip categories into this feature. That would turn a small navigation change into schema/admin work.

## Risks / Trade-offs

- Temporary mismatch between Trips labels and `/hikes` URLs -> Mitigation: document it in specs/design and keep route targets centralized in the navbar/home item lists.
- Users may expect `/trips` immediately after seeing Trips labels -> Mitigation: the link remains direct and functional, and the future rename feature should add `/trips` routes or redirects.
- Localization copy can drift -> Mitigation: add both English and Russian navbar labels in the same slice.

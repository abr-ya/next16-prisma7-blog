## Context

The shared public navbar is a client component rendered by public blog and video layouts. It uses the local Radix-based `NavigationMenu` primitives, where `NavigationMenuList` renders a list-like structure and should contain navigation menu items rather than direct text nodes.

## Goals / Non-Goals

**Goals:**

- Remove the hydration warning by making the navbar's navigation menu list children structurally valid.
- Preserve the current public navigation controls, user menu behavior, and route coverage.
- Keep the implementation local to the public navbar components unless a nearby helper requires a minimal markup fix.

**Non-Goals:**

- Redesigning the navbar layout or visual language.
- Implementing the search modal placeholder.
- Changing auth, admin access, data fetching, route structure, or role checks.

## Decisions

- Keep the visible "Navigation:" label only if it can be represented as valid list content.
  - Rationale: the warning comes from invalid direct list children, not from the label concept itself.
  - Alternative considered: remove the label entirely. This is simpler, but could be a small visible regression if the label is intentional.
- Prefer a local navbar fix over changing the shared `NavigationMenuList` primitive.
  - Rationale: the primitive is generic and already matches the shadcn/Radix pattern; the invalid structure is in the caller.
  - Alternative considered: make the primitive wrap text children automatically. That would hide invalid usage and add surprising behavior to a shared UI component.

## Risks / Trade-offs

- Visual spacing changes after wrapping or moving the label → Compare public blog and video layouts manually in desktop and mobile widths.
- User-menu dropdown markup might reveal a nearby structural warning during browser verification → Fix only the minimum related navbar markup if the warning persists.
- Static checks cannot prove hydration behavior → Include a manual browser console check as implementation validation.

## Migration Plan

No data migration is required. The change can be deployed as a normal frontend markup fix and rolled back by reverting the navbar component edit.

# Design

## Context

The public `/trips` route currently renders only published cards. Creation and editing live in a large client-side administrator panel, whose internal dialog owns the React Hook Form schema, fields, slug generation, and submit behavior. The server-side `createHike` mutation already checks current trust, verified-user quota, input validity, slug uniqueness, and ownership; the existing `/admin/trips` route is owner-scoped for Draft management.

## Goals / Non-Goals

**Goals:**

- Expose one small server-derived creation capability to the public listing so disabled feedback is accurate at render time without becoming authorization.
- Extract the trip form schema, defaults, field layout, and reusable dialog shell into focused `components/forms/trips/` and `components/dialogs/trips/` modules.
- Preserve the complete current field set across public create and administrator create/edit flows, while keeping public success navigation status-aware.

**Non-Goals:**

- No data-model, migration, trust-policy, or quota-policy change.
- No public editing surface, personal `/my/trips` route, broad move of unrelated forms/dialogs, or change to administrator association/participant/note controls.
- No client-side authority shortcut: the capability does not replace the existing creation mutation checks.

## Decisions

### Derive a minimal public creation capability on the server

The public page will request a capability describing only whether creation is available and a safe reason when it is not: sign-in required, insufficient trust, or verified trip quota reached. It will not expose raw trust level, owned-record totals, or other account data. Administrators are eligible regardless of ordinary trust level and verified quota. The existing server action remains the final authority, so stale capability data only results in an actionable submission error.

### Extract trip components by domain, not the whole administrator panel

The current schema, defaults, and title/slug/description/date/type/status fields will move into `components/forms/trips/`. A reusable trip dialog in `components/dialogs/trips/` will own form lifecycle and invoke surface-provided create/update handlers. The administrator panel will retain table state, associations, notes, confirmation flows, and authorization-specific orchestration; the public route will use a narrow create wrapper. This delivers real public/admin reuse without turning either component directory into a generic catch-all.

### Keep status selectable and use existing destinations

The public dialog shows Draft and Published. A successful Published creation navigates to its public trip detail; a successful Draft navigates to `/admin/trips`, the current owner-scoped management destination, until the separate `My Trips` feature replaces that handoff. The alternative of forcing public creation to Published was rejected because the agreed shared form includes status.

### Localize only the new public affordance

New public button, dialog, validation-adjacent, disabled-reason, and submission feedback strings use the existing Trips locale namespace with English fallback. Current administrator copy remains unchanged in this feature; its functional form fields are shared, not its page-level labels or workflow messages.

## Risks / Trade-offs

- [The public capability is stale when submitted] → Retain the existing server trust/quota checks and present their safe result in the dialog.
- [Sharing form state can accidentally weaken admin/public boundaries] → Keep mutation handlers and record lookup outside the shared fields/dialog; each surface supplies only the operation it is authorized to perform.
- [A Draft handoff to `/admin/trips` is less discoverable than `My Trips`] → Make it explicit in public success feedback and track `outdoor-my-trips-page` as the follow-up owner experience.
- [Future reuse requests could trigger broad churn] → Track `shared-cross-surface-forms-dialogs` separately and extract further components only after a genuine second consumer exists.

## Migration Plan

1. Deploy without a migration; the existing trip schema and server mutation remain the source of truth.
2. Existing administrator creation/edit behavior continues through the extracted components.
3. Roll back by removing the public capability and dialog while retaining or inlining the existing administrator form; no stored data requires reversal.

# Proposal

## Why

Eligible users can already create their own trips through the authenticated workspace, but the public Trips page does not explain that capability or provide a direct entry point. A visible public `Add Trip` action will make creation discoverable while clearly explaining why it is unavailable to users who cannot create a trip yet.

## What Changes

- Add an always-visible `Add Trip` control to public `/trips`, enabled only when the current visitor can create a trip.
- Show a localized adjacent explanation when disabled: authentication is required, the account trust level cannot create trips, or a verified-account trip quota is exhausted.
- Open a public creation dialog with the full current trip field set: title, slug, description, start/end dates, type, and Draft/Published status.
- Extract reusable trip fields, validation, and dialog composition from the admin panel so the public creation dialog and current administrator create/edit flow share the same form behavior without importing the admin panel into public routes.
- Keep server-side trust, quota, validation, ownership, and slug-conflict checks authoritative. After success, send Published trips to their public detail page and Draft trips to the current owner-scoped `/admin/trips` workspace until `My Trips` ships.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hikes`: Extend the public trip listing with an eligible-user trip creation entry point and reusable full trip form behavior while retaining existing admin management and public visibility rules.

## Impact

- Affects public `/trips`, the current administrator trip form in `components/admin-pages`, public client dialogs, server capability projection, and existing `createHike` validation.
- Reuses the current Hike data model, trust gate, verified-user trip quota, owner-scoped workspace route, and local UI primitives; no migration or dependency is required.
- Does not add public editing, `My Trips`, new permission classes, changes to trusted-account policy, or a global relocation of unrelated forms/dialogs.

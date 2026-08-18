## Why

Admins should confirm destructive or sensitive actions in an app-styled dialog instead of the browser-native `window.confirm` prompt. This keeps admin workflows visually consistent, accessible, and easier to reuse across video, channel, file, tag, and import actions.

## What Changes

- Add a reusable confirm dialog component built on the existing local shadcn/Radix `Dialog` primitive.
- Allow callers to provide title, description/body text, confirm and cancel button text, button variants, and confirm/cancel handlers.
- Replace current admin `window.confirm` calls for file deletion, video deletion, video channel deletion, legacy tag import, and new video tag creation.
- Preserve existing server actions, authorization checks, loading states, refresh behavior, and toast outcomes.
- Keep the confirmation behavior scoped to admin workflows for this slice.

Non-goals:

- Do not introduce a new dialog library or dependency.
- Do not redesign unrelated forms, tables, or admin navigation.
- Do not change the underlying destructive server actions or data contracts.

## Capabilities

### New Capabilities

- `admin-confirm-dialogs`: Reusable admin confirmation behavior for destructive or sensitive admin actions.

### Modified Capabilities

- None.

## Impact

- Affected admin surfaces: file manager, video table, video channel table, video form tag creation, and content tag legacy import.
- Affected shared UI: a reusable component under `components/common` or an equivalent shared component location.
- Affected primitives: uses existing `components/ui/dialog` and `components/ui/button`.
- No database, Prisma schema, route, or dependency changes are expected.

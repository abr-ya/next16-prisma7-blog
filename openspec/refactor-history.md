# Refactor History

This file preserves completed numbered OpenSpec refactors — internal code-hygiene changes with **no** user-visible behavior change.

Only completed refactors keep permanent `refactor-XXX` numbers. Live unnumbered candidates are tracked in [`refactor-backlog.md`](./refactor-backlog.md), and a candidate receives the lowest unused refactor number only when promoted into implementation. Cancelled or deferred refactor candidates do not reserve refactor numbers.

## Completed Refactors

| ID | Change | Area | Summary |
| --- | --- | --- | --- |
| refactor-001 | `delete-row-confirm` | outdoor/tracks-edit | Extracted `useDeleteRowConfirm<T>({ deleteAction, title, getDescription, deletedMsg, notFoundMsg })` into `lib/use-delete-row-confirm.ts` and wired it into `tracks-admin-panel.tsx`, `hikes-admin-panel.tsx`, and `photos-admin-panel.tsx`, shrinking each by ~35 lines. The hook returns a spreadable `confirmDialogProps` object rather than rendering `ConfirmDialog` itself, so the dialog stays a presentation concern of the panel. Six values parameterize (row generic, action, title, description builder, two toasts); `confirmLabel`, `confirmVariant`, and the post-delete `router.refresh()` are hardcoded. Two behaviors deliberately preserved and flagged in the design: `setTarget(null)` + `router.refresh()` run **unconditionally**, so a failed delete still closes the dialog and refetches; and the hikes panel's `"Trip deleted"` / `"Trip not found"` toasts stay out of sync with its `"Delete hike?"` dialog title, because that is how it already read. Highest-confidence lift from research-001. No behavior change; `skip_specs: true`. Happy path verified in the browser in all three panels on 2026-10-21 — the not-found branch, cancel path, double-submit guard, and a local `npm run build` are deferred to [`openspec/backlog.md`](./backlog.md) as `outdoor-admin-delete-row-confirm-manual-qa`. Artifacts: [`openspec/changes/archive/2026-10-21-refactor-001-delete-row-confirm/`](./changes/archive/2026-10-21-refactor-001-delete-row-confirm/). |

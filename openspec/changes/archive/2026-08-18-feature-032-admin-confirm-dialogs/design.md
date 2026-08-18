## Context

The project already has local shadcn/Radix dialog primitives in `components/ui/dialog.tsx`. Several admin client components still call `window.confirm`, including file pending-delete, video deletion, video channel deletion, legacy tag import, and new video tag creation.

## Goals / Non-Goals

**Goals:**

- Build a small reusable confirm component on top of the existing local dialog primitives.
- Keep call sites simple: provide text, optional button labels/variants, and confirm/cancel handlers.
- Replace current admin `window.confirm` uses without changing the underlying server actions.
- Keep pending/disabled behavior explicit so repeated confirm clicks do not double-submit.

**Non-Goals:**

- Do not add new dependencies or introduce a second dialog system.
- Do not redesign the admin tables or forms beyond replacing the confirmation prompt.
- Do not change server authorization or data mutation contracts.

## Decisions

### Build On Existing Dialog Primitive

Use `components/ui/dialog.tsx` as the foundation and add a project-level `ConfirmDialog` component. This keeps styling, focus handling, and accessibility aligned with the rest of the app.

Alternative considered: use `window.confirm` behind a wrapper. That would not solve visual consistency or async pending-state control.

### Controlled Open State At Call Sites

Each calling component should own whether the dialog is open and run its existing action from the confirm callback. This keeps mutation-specific loading, toast, and refresh logic close to the current code.

Alternative considered: make the confirm component own all async state. That can be convenient, but it hides existing action-specific loading states and makes table/form migrations less direct.

### Confirm Component Supports Optional Copy

The component should accept optional `confirmLabel`, `cancelLabel`, `confirmVariant`, and `isPending` props, with conservative defaults. This avoids repeating boilerplate while still allowing destructive actions to look dangerous.

## Risks / Trade-offs

- Inconsistent call-site state can leave a dialog open after success. Mitigation: close the dialog inside the confirmed action after the existing operation succeeds or after the action starts where appropriate.
- Some forms may already have pending flags. Mitigation: pass those flags through `isPending` instead of introducing duplicate state.
- Dialog text could be too long for compact viewports. Mitigation: use existing dialog responsive width and concise action descriptions.

## Migration Plan

1. Add the reusable confirm dialog component.
2. Replace each current admin `window.confirm` call.
3. Run TypeScript and lint, including targeted ESLint for changed component files outside `app/`.
4. Ask for a local build if the final slice touches routing or user-facing build-sensitive behavior.

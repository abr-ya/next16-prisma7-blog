## 1. OpenSpec And Backlog

- [x] 1.1 Promote `admin-confirm-dialogs` to `feature-032-admin-confirm-dialogs` in `openspec/backlog.md`.
- [x] 1.2 Add proposal, design, tasks, and admin-confirm-dialogs spec delta.
- [x] 1.3 Run `openspec validate feature-032-admin-confirm-dialogs --strict`.

## 2. Shared Confirm Component

- [x] 2.1 Add a reusable app-styled confirm dialog component on top of the existing local dialog primitives.
- [x] 2.2 Support title, description/body text, optional confirm/cancel labels, confirm button variant, pending state, and confirm/cancel handlers.
- [x] 2.3 Keep the component accessible through dialog title/description and keyboard-close behavior.

## 3. Replace Existing Browser Confirms

- [x] 3.1 Replace file pending-delete `window.confirm` in `components/admin-pages/files-table.tsx`.
- [x] 3.2 Replace video channel deletion `window.confirm` in `components/admin-pages/video-channels-table.tsx`.
- [x] 3.3 Replace video deletion `window.confirm` in `components/admin-pages/videos-table.tsx`.
- [x] 3.4 Replace legacy post-tag import `window.confirm` in `components/admin-pages/tags-legacy-migration-panel.tsx`.
- [x] 3.5 Replace new video tag creation `window.confirm` in `components/admin-pages/video-form.tsx`.
- [x] 3.6 Verify no covered admin `window.confirm` calls remain.

## 4. Validation

- [x] 4.1 Run `openspec validate feature-032-admin-confirm-dialogs --strict`.
- [x] 4.2 Run `npm run tsc`.
- [x] 4.3 Run targeted ESLint for changed `components/**` files.
- [x] 4.4 Run `npm run lint` if any `app/**` files changed.

Validation notes:

- No `app/**` files changed, so the app-only `npm run lint` script was not needed for this slice.

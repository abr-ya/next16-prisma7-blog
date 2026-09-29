# Tasks

## 1. Personal-track route and data boundary

- [ ] 1.1 Add the authenticated `/my/tracks` server page using the existing owner-scoped track query; verify an owner sees draft and published tracks while an anonymous request is denied.
- [ ] 1.2 Add a personal-track list presentation that shows title, GPX filename, status, updated time, parse state, and read-only trip association or an explicit unlinked state; verify no cross-user record is rendered.
- [ ] 1.3 Update route revalidation for owner track mutations to refresh `/my/tracks`; verify a create, update, parse, timezone change, and delete refresh the personal list.

## 2. Personal management workflow

- [ ] 2.1 Extract or parameterize the existing owner-safe track form/panel for use outside `/admin/tracks` without exposing cross-user or admin-only controls; verify the existing admin page retains its current behavior.
- [ ] 2.2 Add the My tracks create flow with the existing GPX uploader and form validation; verify a valid upload creates a draft unlinked track owned by the session user and invalid/ineligible files are rejected.
- [ ] 2.3 Expose existing owner-safe edit, GPX replacement, recording-timezone, parse/reparse, and confirmed delete controls from My tracks; verify direct mutations against another user's track remain denied.

## 3. Navigation and documentation

- [ ] 3.1 Add an authenticated My tracks entry to the public user menu and preserve Profile, dashboard, sign-out, and anonymous login behavior; verify the link targets `/my/tracks` only for signed-in users.
- [ ] 3.2 Update the public-route coverage inventory and the OpenSpec backlog/status entries for the new private route and feature; verify the documented route and feature status match implementation scope.

## 4. Validation

- [ ] 4.1 Run `npm run tsc` and resolve type errors attributable to this change.
- [ ] 4.2 Run targeted ESLint for changed files outside `app` plus `npm run lint`, and resolve lint errors attributable to this change.
- [ ] 4.3 Ask the user to run `npm run build` locally and report the result, because sandbox builds can fail on restricted font/network access.
- [ ] 4.4 Perform a local browser check: upload an unlinked GPX track, edit and delete own track, inspect its association state, and verify anonymous and cross-user access/mutations are denied.

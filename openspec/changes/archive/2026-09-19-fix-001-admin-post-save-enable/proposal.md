## Why

Administrators can enter a valid post yet find the `Save changes` button disabled until an unrelated interaction occurs. This blocks normal post creation and editing despite valid form values.

## What Changes

- Make the admin post form evaluate validation while users edit required fields, so the save action enables as soon as the form is valid.
- Preserve existing validation messages, slug generation, image upload, tag selection, create/update actions, and submission protection.

## Capabilities

### New Capabilities

- `admin-post-editing`: Reliable validation and save availability for the admin post create/edit form.

### Modified Capabilities

- None.

## Impact

- Affects `/admin/posts/new`, `/admin/posts/[id]`, and `components/admin-pages/post-form.tsx`.
- No database, route, API contract, dependency, or public-surface changes.

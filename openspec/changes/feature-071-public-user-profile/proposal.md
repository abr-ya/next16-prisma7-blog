## Why

Signed-in users need one private public-site destination for their identity, personal content, and trip invitations instead of finding these features from unrelated pages.

## What Changes

- Add authenticated `/profile` with editable display name and one profile avatar.
- Let users upload, replace, and remove their single profile avatar using the existing managed-file workflow.
- Show links and lightweight counts for the user's own posts, trips, tracks, and photos, with clear empty states.
- Move the trip invitation inbox into the Profile experience and remove the invitation shortcut from individual trip pages.

### Non-goals

- Per-post, per-comment, or multiple selectable avatars; posts/comments continue to render the user's current profile avatar.
- Public profile pages, user directories, role management, or editing other users.
- Changing ownership of existing posts, trips, tracks, or photos.

## Capabilities

### New Capabilities

- `public-user-profile`: Authenticated private profile, profile avatar lifecycle, personal-content summary, and invitation access.

### Modified Capabilities

- `outdoor-trip-participants`: Relocate recipient invitation access from a trip-page shortcut to the private profile while retaining `/trips/invitations` compatibility.

## Impact

- Routes: new `/profile`; existing `/trips/invitations` remains a compatible destination but is linked from Profile.
- Data: use the existing `User.image` profile field and managed file assets; assess a safe replacement/cleanup policy without altering post/comment ownership.
- UI: public navbar user menu, profile page, and trip detail shortcut.

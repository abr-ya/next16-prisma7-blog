## Why

Signed-in users need one private public-site destination where they can see their identity, personal content, and trip invitations instead of finding these features from unrelated pages.

## What Changes

- Add authenticated read-only `/profile` that displays the current display name and avatar.
- Show links and lightweight counts for the user's own posts, trips, tracks, and photos, with clear empty states.
- Render the user's pending trip invitations directly in Profile, with accept and decline actions.
- Retain `/trips/invitations` as a compatible destination for the same invitation inbox.

### Non-goals

- Editing display names or avatars, including upload, replacement, removal, or managed-file lifecycle work.
- Public profile pages, user directories, role management, or editing other users.
- Changing ownership of existing posts, trips, tracks, or photos.

## Capabilities

### New Capabilities

- `public-user-profile`: Authenticated read-only profile, personal-content summary, and invitation inbox.

### Modified Capabilities

- `outdoor-trip-participants`: Render the recipient invitation inbox directly in the private profile while retaining `/trips/invitations` compatibility.

## Impact

- Routes: new `/profile`; existing `/trips/invitations` remains a compatible destination but is linked from Profile.
- Data: read existing user identity, owned content, and invitation records without schema changes or altering ownership.
- UI: public navbar user menu and profile page; no avatar-editing controls.

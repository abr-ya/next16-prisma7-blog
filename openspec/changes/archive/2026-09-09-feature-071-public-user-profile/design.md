## Context

The current authentication user already has a `name` and optional `image`, and the public navbar renders both in its signed-in account menu. Posts, trips, tracks, and photos each store ownership through `userId`; pending trip invitations and their response actions are already available through the authenticated invitation inbox. There is no private profile route.

See `proposal.md` for motivation and the delta specs for observable behavior.

## Goals / Non-Goals

**Goals:**

- Provide one authenticated, read-only profile surface for the current user.
- Display the existing `User.image` avatar and name without creating any avatar-management flow.
- Summarize the current user's owned content without new profile-scoped listing routes.
- Reuse the established invitation query and response controls directly in Profile.

**Non-Goals:**

- Add public user pages, a directory, user-managed roles, or cross-user profile editing.
- Change display names or avatars, introduce avatar uploads, or alter managed-file lifecycle behavior.
- Change the ownership of posts, trips, tracks, or photos.
- Move invitation state or alter the accepted-participant authorization contract.

## Decisions

### Render existing identity fields without profile mutations

The profile page is server-rendered under the existing public top-nav layout and derives the current user from the authenticated session. It displays the existing `name`, `email`, and optional `image`; the established avatar fallback is used when no image exists. It provides no form, upload route, file-asset purpose, or mutation action.

This keeps the slice read-only and requires neither a Prisma migration nor a change to existing post/comment avatar readers. Editable identity settings were considered but are intentionally deferred to a later feature.

### Summarize owned records, including drafts, without introducing profile listings

The profile reads counts for records owned by the signed-in user across posts, trips, tracks, and photos. It links to existing applicable management or content destinations and uses an explicit zero-state in the profile instead of creating new profile-scoped listings. Counts include the user's own draft and published records because the surface is private.

Building new `/profile/*` listing routes was considered but deferred because it broadens navigation and list/filter behavior beyond a lightweight summary.

### Render the existing invitation inbox directly in Profile

Profile obtains pending invitations through the established current-user query and renders the existing accept/decline interaction component in the page. `/trips/invitations` remains a compatible route that uses the same query and component. Owner/admin participant-management controls are unchanged.

Linking to the existing route only was considered, but direct rendering is the requested profile experience and reuses existing authorization checks rather than creating a second mutation contract.

## Risks / Trade-offs

- [Counts can become stale after content changes] → Read counts on the server and revalidate Profile after relevant content mutations in later slices as needed.
- [Invitation state changes from Profile] → Reuse the existing current-user response action and revalidate the Profile and compatible inbox route after a response.
- [Users expect identity controls] → Clearly present identity fields as read-only; avatar and display-name editing are explicitly deferred.

## Migration Plan

1. Deploy the current-user profile summary and authenticated profile page without a database migration.
2. Deploy navigation and direct invitation rendering; retain `/trips/invitations` so existing bookmarks and links continue to work.
3. Roll back application code if necessary; no data is migrated or rewritten by this feature.

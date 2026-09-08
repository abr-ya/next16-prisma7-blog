## Context

Trip records retain the internal `Hike` Prisma/API domain after feature-069, including a `userId` owner relation. Public Trip routes already exist, while all public detail data is visibility-filtered. The current roadmap has no membership model, no invitation UI, and no configured outbound mail system.

## Goals / Non-Goals

**Goals:**

- Add a durable, auditable, invitation-backed relationship from a trip to an existing user.
- Make accepted membership easy for later public photo and track contribution features to authorize consistently.
- Keep recipients' invitation state private and permit owner/admin management without weakening owner boundaries.

**Non-Goals:**

- External notification delivery, guest accounts, invitation links, or account registration from an invite.
- Rendering the group publicly, including avatars.
- Retrofitting existing track/photo ownership or contribution behavior.

## Decisions

### One relation stores invitation lifecycle and active membership

Add an additive Prisma model (for example, `HikeParticipant`) keyed uniquely by `(hikeId, userId)`, with inviter identity, a status enum (`PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`, `EXPIRED`), timestamps, and an optional response timestamp. `ACCEPTED` is active membership; a later invitation after decline/cancellation reuses the same pair by transitioning it back to `PENDING` and recording the current inviter/timestamps. This avoids duplicate invitations and gives later authorization one stable query target.

Alternative: separate invitation and membership tables. That offers a full invitation history, but adds joins and duplicate integrity rules before contribution workflows need audit history.

### Email resolves only an existing account

Server actions normalize the supplied email and look up the existing user. They return a generic non-invitable result for unknown, owner, duplicate-pending, and already-accepted addresses, so the trip UI is not an account-directory lookup. No mail is sent: recipients discover pending invitations through an authenticated `/trips/invitations` page, including invitations for draft trips that must remain unavailable through public detail routes.

Alternative: send tokenized email invitations to anyone. It requires an email provider, delivery/error handling, token security, expiration UX, and a registration/link-account policy not present in this project.

### Authorization is centralized and state-aware

Trip helper functions will load the trip owner and current membership state. Owner or admin can invite, cancel, and remove; only the addressed user can accept/decline; users may never self-add. A shared `isAcceptedTripParticipant`-style server helper will become the future authorization boundary. Pending and inactive states never grant permissions. Participant controls are rendered only for the authorized authenticated context, and server actions enforce the rule independently.

Alternative: trust client-side route conditions or make participants editable in the admin panel only. Both fail the owner-managed public workflow and are insecure/inflexible for later contributions.

### Private data stays out of public trip reads

Public trip list/detail types will not select or serialize invitation/member rows. Owner/admin management views and the recipient inbox use narrow projections: display name/email only where the authenticated manager or recipient needs it. Revalidate the affected `/trips/[slug]`, `/trips/invitations`, and relevant admin paths after mutation.

### Participant management is a compact header action

The authorized owner/admin view of a trip renders a compact participant-management trigger in the right side of the page header. Its dialog contains the email invite form and pending/accepted management lists. This keeps the public trip narrative, map, tracks, and photos from being displaced by a potentially long private list while preserving the same server-enforced actions.

## Risks / Trade-offs

- Existing users may miss in-app invitations without an email notification → Make the inbox route reachable from authenticated trip UX; evaluate delivery as a separate feature.
- A unique pair loses historical repeated-invite records → Preserve the current lifecycle timestamps; introduce a history table only if audit needs emerge.
- A deleted user/trip can leave dangling relations → Use foreign keys with cascade deletion and verify migration behavior.
- Email-address probing could leak account presence → Use neutral invitation errors and rate-limit naturally through authenticated server actions; avoid autocomplete/search output.
- A long participant list can make a dialog dense on small screens → Keep rows compact and let the dialog scroll independently of the trip page.

## Migration Plan

1. Add the enum/model and reverse relations through an additive Prisma migration; do not alter existing trip, user, or media rows.
2. Regenerate Prisma client using the project flow and validate schema/types.
3. Deploy code that treats the absent relation as no membership; existing content remains unchanged.
4. Roll back application code safely if needed. The additive table can remain without affecting existing records; do not delete data or rewrite migrations.

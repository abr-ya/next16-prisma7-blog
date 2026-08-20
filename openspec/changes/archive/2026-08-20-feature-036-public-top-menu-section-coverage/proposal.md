## Why

Visitors and signed-in users should be able to reach the primary public content sections directly from the shared top menu. After the navbar hydration fix, the next user-facing outcome is to make that menu complete across the public site instead of only linking home and videos.

## What Changes

- Add primary public section links to the shared public navbar: Home, Blog, Docs, Videos, and Comments.
- Preserve the auth-aware account area so anonymous users still see a login entry point and signed-in users still see the account menu.
- Keep the existing back navigation and search placeholder access unless implementation evidence shows they conflict with the completed section coverage.
- Keep navigation markup hydration-safe.

Non-goals:

- No route, data model, database, or permission changes.
- No new search implementation.
- No redesign of the admin sidebar or admin-only navigation.
- No mounting the shared public navbar into additional route layouts; follow-up candidate `public-navbar-route-coverage` tracks where else it should appear.
- No mobile drawer or responsive navigation overhaul beyond making the existing shared navbar fit the new section links.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `public-navigation`: Expand the shared public navbar requirement so it covers all primary public sections while preserving auth-aware account access and hydration-safe markup.

## Impact

- Affected public surface: shared navbar where it is already mounted, currently the blog and videos public route groups.
- Likely affected code: `components/blog-pages/navbar.tsx` and any nearby navbar helper or index exports needed by the existing implementation.
- Affected routes by navigation target: `/`, `/blog`, `/docs`, `/videos`, and `/comments`.
- Data models, APIs, auth storage, and admin routes are not expected to change.

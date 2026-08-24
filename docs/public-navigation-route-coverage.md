# Public Navigation Route Coverage

This inventory tracks where the shared public navbar is currently mounted, where it is intended to be mounted, and which route families must stay outside the public navbar shell. Routes that use the shared top navigation live under the URL-neutral `app/(site-top-nav)` route group.

## Primary Public Routes

| Route family | Current navbar state | Intended state | Feature 040 state | Notes |
| --- | --- | --- | --- | --- |
| `/` | Not covered | Covered by shared public shell | Deferred | Home keeps its current hero/content layout in feature 040. |
| `/blog` | Covered by `app/blog/layout.tsx` | Covered by shared public shell | Existing layout preserved | Consolidation is deferred to the rollout slice. |
| `/blog/[slug]` | Covered by `app/blog/layout.tsx` | Covered by shared public shell | Existing layout preserved | Consolidation is deferred to the rollout slice. |
| `/docs` | Covered by `app/(site-top-nav)/layout.tsx` | Covered by shared public shell | Covered as pilot | Docs listing validates the reusable shell on a public listing route. |
| `/docs/[slug]` | Covered by `app/(site-top-nav)/layout.tsx` | Covered by shared public shell | Covered as pilot | Docs detail validates the reusable shell on a public detail route. |
| `/videos` | Covered by `app/videos/layout.tsx` | Covered by shared public shell | Existing layout preserved | Consolidation is deferred to the rollout slice. |
| `/videos/[id]` | Covered by `app/videos/layout.tsx` | Covered by shared public shell | Existing layout preserved | Consolidation is deferred to the rollout slice. |
| `/comments` | Not covered | Covered by shared public shell | Deferred | Comments remains unchanged until the rollout slice. |

## Excluded Route Families

| Route family | Reason |
| --- | --- |
| `/admin/*` | Admin routes use the admin shell and server-side role checks. |
| `/sign-in` | Auth routes keep a focused sign-in flow. |
| `/sign-up` | Auth routes keep a focused sign-up flow. |
| `/api/*` | API route handlers do not render public page chrome. |
| `/api/uploadthing/*` | UploadThing route handlers do not render public page chrome. |
| `/files/*` | File preview and download routes are delivery surfaces, not primary public content navigation surfaces. |
| Framework/static internals | Next.js internals and static assets do not render application navigation. |

## Follow-up Rollout

The follow-up `public-navbar-route-coverage-rollout` candidate should move deferred primary public routes into `app/(site-top-nav)`, then consolidate Blog/Videos layout wiring after the Docs pilot is proven. As each route moves, check for legacy page-level back navigation, duplicate navigation controls, and oversized top spacing introduced by older standalone layouts.

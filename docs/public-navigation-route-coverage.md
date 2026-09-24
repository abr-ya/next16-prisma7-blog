# Public Navigation Route Coverage

This inventory tracks where the shared public navbar is currently mounted, where it is intended to be mounted, and which route families must stay outside the public navbar shell. Routes that use the shared top navigation live under the URL-neutral `app/(public)` route group.

## Primary Public Routes

| Route family | Current navbar state | Intended state | Feature 040 state | Notes |
| --- | --- | --- | --- | --- |
| `/` | Covered by shared public shell | Covered by shared public shell | Covered by shared public shell | |
| `/blog` | Covered by shared public shell | Covered by shared public shell | Covered by shared public shell | |
| `/blog/[slug]` | Covered by shared public shell | Covered by shared public shell | Covered by shared public shell | |
| `/docs` | Covered by `app/(public)/layout.tsx` | Covered by shared public shell | Covered as pilot | Docs listing validates the reusable shell on a public listing route. |
| `/docs/[slug]` | Covered by `app/(public)/layout.tsx` | Covered by shared public shell | Covered as pilot | Docs detail validates the reusable shell on a public detail route. |
| `/videos` | Covered by shared public shell | Covered by shared public shell | Covered by shared public shell | |
| `/videos/[id]` | Covered by shared public shell | Covered by shared public shell | Covered by shared public shell | |
| `/tracks` | Covered by `app/(public)/layout.tsx` | Covered by shared public shell | Covered in feature 048 | Public tracks listing uses the shared shell. |
| `/tracks/[slug]` | Covered by `app/(public)/layout.tsx` | Covered by shared public shell | Covered in feature 048 | Public track detail uses the shared shell. |
| `/comments` | Covered by shared public shell | Covered by shared public shell | Covered by shared public shell | |

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

Applied via feature-089-public-navbar-route-coverage-rollout: home, blog, videos, and comments moved under the shared `app/(public)` shell; the `PageLayout.showBackLink` affordance was dropped from the component and its call sites.

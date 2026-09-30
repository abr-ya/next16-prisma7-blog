# Design

## Context

The shared `(public)` route group already supplies server-rendered navigation and the application has a small English/Russian locale resource structure. Public content routes are separate pages with their own data access and visibility rules. The guide is intentionally static: it explains those routes rather than loading their content or becoming a second content-management surface.

## Goals / Non-Goals

**Goals:**

- Add a coherent `/about` route family that works for anonymous and signed-in visitors.
- Keep guide structure and section destinations in one typed, reusable definition to prevent overview cards and detail pages from drifting.
- Localize all guide-owned copy with the active public locale.
- Make the trust-level explanation accurate at release time without exposing any private user or admin data.

**Non-Goals:**

- Add database models, migrations, editable guide content, or new dependencies.
- Infer, calculate, or display a viewer's own trust status on public guide pages.
- Change enforcement implemented by the account-trust feature slices.

## Decisions

### Use a static `/about` route family under the existing public shell

The overview, account-level page, and section pages will be server pages under `app/(public)/about`. They inherit the existing `PublicNavbarShell`, so public and authenticated chrome stays consistent without a second layout or authorization branch.

Alternative considered: place explanatory text inside each existing section page. Rejected because it would clutter content-first routes and make the project overview hard to discover as a coherent whole.

### Model section guide metadata once and reuse it

A small code-owned guide definition will enumerate the stable section slug, locale keys, and current public destination for Blog, Docs, Videos, Trips, Tracks, and Comments. The overview and dynamic section route will read it; unknown slugs will use the standard not-found behavior.

Alternative considered: one independently authored route file per section. Rejected because repeated static layout and links would drift when section routes change.

### Keep trust copy policy-derived and release-gated

The account-level copy will be static localization content, but its claims must be reviewed against the current server-enforced trust behavior before release. The implementation task is sequenced after the trust gates and quotas/auto-promotion work so the guide cannot advertise unenforced restrictions or promotions. It explains general policy only, not any viewer's state.

Alternative considered: derive prose directly from trust constants at render time. Rejected because policy explanation needs readable editorial language and not every operational detail belongs in public copy; review plus tests/checklist preserves accuracy with less coupling.

### Add the guide as a localized navbar item

`/about` will be exposed as an additional compact item in the existing shared navbar and translated through the existing navigation namespace. The existing primary content links and their targets remain intact.

Alternative considered: expose the guide only from the home page. Rejected because visitors entering on a deep content URL would have no predictable discovery path.

## Risks / Trade-offs

- [Trust rules evolve after copy is written] → Review the guide copy against the final gate and quota behavior before release; update the guide in the same change when policy wording changes.
- [Navbar becomes crowded on narrow viewports] → Reuse the existing wrapping navigation layout and verify the guide item on desktop and mobile widths.
- [Guide destinations become stale after route migrations] → Centralize current destinations in the guide definition and cover each link in manual route checks.
- [Localized copy is incomplete] → Require both locale resources and exercise the existing default-language fallback.

## Migration Plan

No data migration is required. Deploy the static routes, locale resources, and navbar item together. Rollback consists of removing the guide navigation item and route files; no persisted state is created.

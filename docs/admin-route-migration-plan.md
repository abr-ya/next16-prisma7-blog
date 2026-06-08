# Admin Route Migration Plan

## Context

The current admin area lives in the App Router route group `app/(admin)`. Because route groups are invisible in URLs, admin pages currently resolve to root-level paths such as `/dashboard`, `/posts`, `/videos`, and `/md-docs`.

The goal is to make the admin area visible in URLs by moving it under `app/admin`, and to make the dashboard the main admin index page at `/admin`.

## Goals

- Move the admin dashboard from `/dashboard` to `/admin`.
- Move all admin-only pages under the `/admin` URL prefix.
- Update internal links, redirects, breadcrumbs, and revalidation paths.
- Keep public routes available for future public-facing pages, especially `/videos`.

## Route Changes

| Current route | New route |
| --- | --- |
| `/dashboard` | `/admin` |
| `/posts` | `/admin/posts` |
| `/posts/new` | `/admin/posts/new` |
| `/posts/[id]` | `/admin/posts/[id]` |
| `/categories` | `/admin/categories` |
| `/links` | `/admin/links` |
| `/md-docs` | `/admin/md-docs` |
| `/md-docs/new` | `/admin/md-docs/new` |
| `/md-docs/[id]` | `/admin/md-docs/[id]` |
| `/saved-posts` | `/admin/saved-posts` |
| `/videos` | `/admin/videos` |
| `/videos/new` | `/admin/videos/new` |
| `/videos/[id]` | `/admin/videos/[id]` |

## File Moves

- Move `app/(admin)/layout.tsx` to `app/admin/layout.tsx`.
- Move `app/(admin)/dashboard/page.tsx` to `app/admin/page.tsx`.
- Move `app/(admin)/posts/**` to `app/admin/posts/**`.
- Move `app/(admin)/categories/**` to `app/admin/categories/**`.
- Move `app/(admin)/links/**` to `app/admin/links/**`.
- Move `app/(admin)/md-docs/**` to `app/admin/md-docs/**`.
- Move `app/(admin)/saved-posts/**` to `app/admin/saved-posts/**`.
- Move `app/(admin)/videos/**` to `app/admin/videos/**`.

## Link Updates

Update admin navigation and admin entry links:

- `components/admin-pages/admin-sidebar.tsx`
- `components/home-page/hero-section.tsx`
- `components/blog-pages/navbar-user-menu.tsx`

Update form redirects after successful save:

- `components/admin-pages/post-form.tsx`
- `components/admin-pages/md-doc-form.tsx`
- `components/admin-pages/video-form.tsx`

Update breadcrumbs and create/edit links in admin pages:

- `app/admin/posts/page.tsx`
- `app/admin/posts/[id]/page.tsx`
- `app/admin/categories/page.tsx`
- `app/admin/links/page.tsx`
- `app/admin/md-docs/page.tsx`
- `app/admin/md-docs/[id]/page.tsx`
- `app/admin/saved-posts/page.tsx`
- `app/admin/videos/page.tsx`
- `app/admin/videos/[id]/page.tsx`

Update server-side revalidation paths:

- `app/_data/videos.ts`
- Check other data actions for hard-coded admin paths before final verification.

## Implementation Steps

1. Create `app/admin`.
2. Move the current `(admin)` layout and routes into `app/admin`.
3. Rename the dashboard page route from `app/admin/dashboard/page.tsx` to `app/admin/page.tsx`.
4. Update admin sidebar URLs to use `/admin`.
5. Update home page and navbar user menu admin links from `/dashboard` to `/admin`.
6. Update all admin breadcrumbs and admin create/edit links.
7. Update form redirects after successful create/update.
8. Update `revalidatePath` calls for moved admin pages.
9. Search for stale root-level admin links.
10. Run typecheck and lint if the local toolchain is available.

## Verification

Search commands:

```bash
rg -n '"/(dashboard|posts|categories|links|md-docs|saved-posts|videos)(/|"|\?)|href=\{?"/(dashboard|posts|categories|links|md-docs|saved-posts|videos)|router\.push\("/(dashboard|posts|categories|links|md-docs|saved-posts|videos)|revalidatePath\("/(dashboard|posts|categories|links|md-docs|saved-posts|videos)' app components lib hooks
```

Expected manual checks:

- `/admin` opens the admin dashboard.
- `/admin/posts` opens the posts admin page.
- `/admin/posts/new` opens the post create page.
- `/admin/md-docs` and `/admin/md-docs/new` work.
- `/admin/videos` opens the video admin placeholder page.
- `/admin/videos/new` opens the video create form.
- Home page admin link points to `/admin`.
- Navbar user menu admin link points to `/admin`.

Project checks:

```bash
npm run tsc
npm run lint
```

Note: in the current execution environment, `npm` was not available when last checked, so these commands may need to be run locally after the route migration.

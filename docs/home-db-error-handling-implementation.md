# Home page database error handling — implementation report

## Summary

The home page no longer crashes when the database is unreachable: Hero and About still render, and the “Recent Markdown Posts” section shows an English error message instead of failing the whole route. **Recent posts are loaded in a separate async server component inside `Suspense`**, so Hero and About appear immediately while the DB query runs (or times out); without this, the entire page stayed blank until Prisma finished. A root `app/error.tsx` provides a consistent fallback with **Try again** for uncaught errors elsewhere.

## Changes

| File | Purpose |
|------|---------|
| [`docs/home-db-error-handling-plan.md`](home-db-error-handling-plan.md) | Repo-local implementation plan (English) |
| [`docs/home-db-error-handling-implementation.md`](home-db-error-handling-implementation.md) | This report |
| [`app/page.tsx`](../app/page.tsx) | Sync shell: Hero + About + `Suspense` around `HomeRecentMarkdownPosts` |
| [`app/_components/home-recent-markdown-posts.tsx`](../app/_components/home-recent-markdown-posts.tsx) | Async: `try/catch` around `getLatestBlogPosts()`, passes `loadError` to `PostsSection` |
| [`app/_components/home-recent-posts-fallback.tsx`](../app/_components/home-recent-posts-fallback.tsx) | Suspense fallback (“Loading posts…”) while posts segment loads |
| [`components/blog-posts/posts-section.tsx`](../components/blog-posts/posts-section.tsx) | Optional `loadError`; alert-style block when set; hides “View all posts” while errored |
| [`lib/prisma-blog-load-error-message.ts`](../lib/prisma-blog-load-error-message.ts) | Maps `P1001` and `PrismaClientInitializationError` to an “cannot reach database” message; else generic English message |
| [`app/error.tsx`](../app/error.tsx) | Client root error boundary: title “Something went wrong”, detail (dev: `error.message`, prod: generic), **Try again** → `reset()` |

## User-visible strings (English)

- Home posts load failure (generic): `Unable to load posts. Please try again later.`
- Home posts load failure (unreachable DB): `Cannot reach the database. Check that the service is running and try again.`
- Home posts loading (Suspense): `Loading posts...`
- Root error page title: `Something went wrong`
- Root error page detail (production): `An unexpected error occurred. Please try again.`
- Root error button: `Try again`

## How to verify

1. **Home with DB down or slow:** stop PostgreSQL or use a bad `DATABASE_URL`, open `/`. Expect Hero + About immediately, then either “Loading posts…” briefly or the red error in the recent posts section (not “No posts yet.” if the query failed).
2. **Root error boundary:** open a route that throws during render without a local catch (e.g. temporarily throw in a server page), or trigger a different uncaught error; expect `app/error.tsx` with **Try again**.
3. **Normal operation:** with a healthy DB, home should list posts as before; `/blog-md` unchanged (no `loadError` prop).

## Notes

- Server-side details are logged via `console.error` in `home-recent-markdown-posts.tsx`; the UI does not expose stack traces in production (`app/error.tsx` only shows `error.message` in development).

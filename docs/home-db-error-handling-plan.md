# Home page database error handling — implementation plan

## Scope

- Handle DB connection failures on the **home page** (`app/page.tsx`) without crashing the app: keep Hero and About, show a clear error for the posts section.
- Distinguish **load failure** from **empty list** in `PostsSection` (empty must not show as “No posts yet” when the DB is unreachable).
- Add a **mandatory** root `app/error.tsx` (client boundary) with English copy and **Try again** (`reset()`), aligned with the app’s UI for uncaught errors on other routes.
- **UI copy is English only** for user-visible strings.
- **Documentation:** this file is the repo-local plan; after implementation, add `docs/home-db-error-handling-implementation.md`.

## Current behavior

- `getLatestBlogPosts()` is awaited with no `try/catch`; Prisma/pg errors bubble and replace the page with the default Next.js error UI.
- `PostsSection` shows “No posts yet.” for any empty array, including when the failure should be an error state.

## Approach

1. **`app/page.tsx`:** wrap `getLatestBlogPosts()` in `try/catch`. On failure, set `posts` to `[]` and a `loadError` string. Log the real error with `console.error` on the server only.
2. **`PostsSection`:** optional `loadError?: string | null`. When set, render an error block (priority over list and over “No posts yet.”). Optionally hide or keep “View all” when errored — prefer **hide** if the database is unavailable.
3. **Optional Prisma codes:** map **P1001** and `PrismaClientInitializationError` to a specific English message; otherwise a generic English message.
4. **`app/error.tsx`:** required; `"use client"`, `{ error, reset }`, no stack trace in production UI, **Try again** button.

## Files to touch

| File | Change |
|------|--------|
| `docs/home-db-error-handling-plan.md` | This document |
| `docs/home-db-error-handling-implementation.md` | Implementation report (after coding) |
| `app/page.tsx` | `try/catch`, pass `loadError` |
| `components/blog-posts/posts-section.tsx` | `loadError` prop + error UI |
| `app/error.tsx` | Root error boundary |

## Out of scope

- No changes to `lib/prisma.ts` singleton unless required by bugs.
- Other routes are not individually wrapped unless needed later; root `error.tsx` covers uncaught errors.

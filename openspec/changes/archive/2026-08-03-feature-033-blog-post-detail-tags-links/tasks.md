## 1. Post Detail Tags

- [x] 1.1 Replace the `/blog/{slug}` tag placeholder with rendering for existing `post.tags` values.
- [x] 1.2 Preserve layout when a post has no tags by omitting the tag placeholder.
- [x] 1.3 Keep tag display compatible with legacy `Post.tags` data and out of scope for shared content-tag migration.

## 2. Connected Links Visibility

- [x] 2.1 Add a `post.links.length > 0` guard before rendering any connected-link section or prompt.
- [x] 2.2 Preserve the existing authenticated connected-link list and link actions when links exist.
- [x] 2.3 Preserve the anonymous sign-in prompt only for posts that actually have connected links.

## 3. Validation

- [x] 3.1 Run `openspec validate feature-033-blog-post-detail-tags-links --strict`.
- [x] 3.2 Run `npm run tsc`.
- [x] 3.3 Run targeted ESLint for `app/blog/[slug]/page.tsx`.
- [x] 3.4 Run `npm run lint`.
- [x] 3.5 Ask for or perform a browser check covering a tagged post, an untagged post, a post with connected links, and a post without connected links.
- [x] 3.6 Run `git diff --check`.

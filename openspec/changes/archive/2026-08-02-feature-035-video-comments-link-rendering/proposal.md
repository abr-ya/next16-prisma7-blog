## Why

`feature-021-comment-link-handling-structure` defines how plain URLs in comments should become safe clickable links. Public video comments are the first implemented comment surface, so they are the right narrow target for applying that policy without changing comment storage or expanding into post comments, previews, or moderation.

## What Changes

- Add a shared comment text segmentation helper for plain text and safe web-link segments.
- Render recognized `https://`, `http://`, and `www.` URLs as clickable links in public video comment text.
- Normalize `www.` URL hrefs to `https://` while preserving the visible comment text.
- Keep unsupported schemes and invalid URL candidates as plain text.
- Preserve existing comment creation, storage, list ordering, author display, and count behavior.

### Non-goals

- Do not change the `Comment` Prisma model or add migrations.
- Do not add markdown, HTML rendering, rich text, embeds, link previews, or unfurl cards.
- Do not apply link rendering to post comments or the `/comments` feed yet.
- Do not change comment ownership, edit/delete, expiry, moderation, or spam controls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `video-comments`: Public video comment list rendering now includes safe clickable web links for supported plain URLs.
- `comment-link-handling-structure`: Applies the accepted structure to the first runtime comment surface.

## Impact

- Affected UI: public video detail comment list text.
- Affected helpers: new shared comment text segmentation and rendering helpers.
- Affected data: existing `Comment.content` plain text only; no persisted changes.
- No route, schema, migration, auth, or dependency changes are expected.

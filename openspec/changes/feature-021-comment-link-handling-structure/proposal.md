## Why

Public comments currently render user text as plain text. When people paste a normal URL into a comment, visitors cannot follow it without manually copying the text. The project needs a small, explicit comment-link policy before links become clickable, so comment rendering stays useful without opening a broad rich-text, markdown, or moderation feature.

## What Changes

- Define plain URL handling for project comments.
- Decide that recognized `http://`, `https://`, and `www.` URLs in comment text may become safe clickable links during rendering.
- Keep stored comment content as plain text; no HTML or markdown is persisted for link rendering.
- Define parsing, normalization, sanitization, display, and external-link attributes for future implementation.
- Keep current video comment behavior unchanged until an implementation slice applies the policy.

### Non-goals

- Do not implement link rendering in this structure slice.
- Do not add rich text, markdown syntax, mentions, hashtags, embeds, previews, or automatic unfurling.
- Do not change the `Comment` Prisma model or add migrations.
- Do not add comment moderation, spam scoring, domain blocklists, or admin review queues.
- Do not change video comment create/edit/delete ownership rules.
- Do not implement shared post comments or the `/comments` unified feed.

## Capabilities

### New Capabilities

- `comment-link-handling-structure`: Defines how plain URLs in comment text should be recognized, normalized, sanitized, rendered, and bounded.

### Modified Capabilities

None.

## Impact

- Affected future UI: public comment list rendering, starting with video comments.
- Affected future helpers: a shared comment text/link segmentation helper and a shared safe comment content renderer.
- Affected data: existing `Comment.content` plain-text values only; no schema or migration impact.
- Affected security surface: user-submitted text that may render external anchors.
- No runtime behavior changes are expected in this planning slice.

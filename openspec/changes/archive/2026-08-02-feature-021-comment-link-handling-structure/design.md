## Context

Video comments already store `Comment.content` as plain text and render that text on public video detail pages. The current comment domain plan keeps comments flat, project-wide, and target-aware, with video comments as the first supported target. Link handling was intentionally left as a separate follow-up so URL parsing and safe anchor rendering can be decided before implementation.

This change is a structure slice. It defines the policy for comment links and the shape of the future implementation, without changing Prisma schema, migrations, runtime helpers, routes, or UI behavior.

## Goals / Non-Goals

**Goals:**

- Define whether plain URLs in comments should become clickable.
- Define the first supported URL patterns and normalization rules.
- Define a safe rendering contract for comment text that contains links.
- Keep the policy reusable across video comments, future post comments, and future unified comment feed items.
- Keep storage plain-text and compatible with existing comments.

**Non-Goals:**

- No runtime linkification in this planning slice.
- No markdown, HTML, rich text, embeds, link previews, or unfurl cards.
- No schema changes or stored link metadata.
- No moderation queue, spam scoring, domain allowlist, or domain blocklist.
- No changes to comment ownership, edit/delete expiry, post comments, or `/comments` feed behavior.

## Decisions

### Decision: Linkify plain URLs during rendering only

Future implementation should keep `Comment.content` as plain text and convert recognized URLs into anchor elements only at render time. This preserves existing data, keeps create/update flows simple, and avoids storing user-provided HTML.

Alternative considered: store parsed link metadata or sanitized HTML. That would make rendering faster or richer, but it adds migration, sanitization, and update complexity before comments need previews or moderation metadata.

### Decision: Support only web URLs first

The first policy should recognize:

- `https://example.com/path`
- `http://example.com/path`
- `www.example.com/path`

`www.` links should render with an `https://` href while preserving the visible text from the comment. Other schemes such as `javascript:`, `data:`, `mailto:`, `tel:`, and relative URLs should remain plain text until a later feature explicitly adds them.

Alternative considered: support every URL accepted by the browser `URL` constructor. That is too broad for user-submitted comments because non-web schemes can be surprising or unsafe in public text.

### Decision: Use a small shared tokenizer

Future implementation should add a shared helper that converts comment text into ordered segments:

```ts
type CommentTextSegment =
  | { type: "text"; text: string }
  | { type: "link"; text: string; href: string };
```

The helper should own URL recognition, trailing punctuation trimming, scheme validation, and `www.` normalization. React rendering should consume segments and let React escape text normally.

Alternative considered: use regex replacement directly inside the component. That is faster to write, but it spreads parsing and sanitization rules into UI code and makes future post/feed reuse harder.

### Decision: Keep rendering restrained

Clickable comment links should render as inline anchors inside the existing comment text flow. Anchors should open in a new tab and use `rel="nofollow ugc noopener noreferrer"` for external user-generated links. The visible link text should be the original URL text, with CSS allowed to wrap or truncate long unbroken links so comments cannot break the layout.

Alternative considered: render a separate link preview below the comment. That expands the feature into fetching, metadata parsing, moderation, and privacy questions.

### Decision: Keep invalid and unsupported URLs as text

If a candidate URL cannot be normalized into a safe `http` or `https` URL, it should remain plain text. Failed parsing should not reject the whole comment and should not mutate the stored content.

Alternative considered: reject comments containing unsupported schemes. That would make validation stricter than current plain-text comments and create friction before moderation policies exist.

## Security / Privacy

- Never render user comment content through `dangerouslySetInnerHTML`.
- Do not persist sanitized HTML.
- Only render anchors for normalized `http` and `https` hrefs.
- Preserve ordinary React escaping for text segments.
- Use external-link attributes on generated anchors: `rel="nofollow ugc noopener noreferrer"` and `target="_blank"`.
- Treat link previews, unfurls, and server-side metadata fetching as separate future work because they can leak visitor/server requests to third-party sites.

## Future Implementation Shape

The implementation slice should be small:

1. Add a shared comment text segmentation helper, likely under `lib/comments` or another existing shared helper location.
2. Add unit-like coverage if the repo has a suitable lightweight pattern, or at minimum cover the helper through TypeScript plus focused examples in the implementation notes.
3. Add a small reusable renderer for segmented comment text or update the existing video comment list rendering with a local wrapper that can later be extracted.
4. Apply the renderer to public video comment list items first.
5. Manually browser-check comments with no URL, one `https://` URL, one `www.` URL, trailing punctuation, unsupported schemes, and a very long URL.

## Risks / Trade-offs

- Regex URL detection can over-match punctuation or partial text -> keep parsing helper focused and test representative examples.
- Long URLs can break card layout -> ensure generated anchors can wrap within comment containers.
- Opening links in a new tab can be surprising -> use consistent styling and external-link attributes for safety.
- A plain `http://` link may be insecure -> preserve explicit user input for `http://`, but normalize `www.` to `https://`.
- Unsupported schemes remaining as text may disappoint some users -> keep the first policy narrow and revisit only when a real use case appears.

## Migration Plan

No data migration is required. Existing comments stay plain text. Rollback for the later implementation should be limited to rendering all segments as text again.

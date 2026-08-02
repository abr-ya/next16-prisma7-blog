## Context

Public video comments render through `components/video-pages/video-comment-composer.tsx` using plain `Comment.content` loaded by `app/_data/video-comments.ts`. The accepted comment link handling structure says links should be recognized at render time only, stored content should stay plain text, and the first runtime target should be public video comment list rendering.

## Goals / Non-Goals

**Goals:**

- Add a small reusable comment text tokenizer.
- Render supported plain web URLs as inline anchors in video comments.
- Keep React escaping for ordinary text.
- Keep unsupported or invalid link candidates as plain text.
- Keep long URLs inside the existing comment card layout.

**Non-Goals:**

- No Prisma/schema changes.
- No comment mutation changes.
- No link previews, markdown, rich text, or stored sanitized HTML.
- No post comment or `/comments` feed changes.

## Decisions

### Shared tokenizer under `lib`

Add a small helper in `lib` that returns ordered text/link segments. Keeping tokenization outside the component makes the parsing and safety policy reusable for post comments and feed items later.

### Renderer component for comment text

Add a small common renderer that consumes the tokenizer and renders plain text plus generated anchors. This keeps the video comment component focused on list/composer behavior.

### Anchor safety

Generated anchors use `target="_blank"` and `rel="nofollow ugc noopener noreferrer"`. Unsupported schemes are never converted to anchors because the tokenizer only accepts normalized `http` and `https` URLs.

## Validation

Static checks should include TypeScript and targeted ESLint for the changed component/helper files. Manual browser checks should cover comments with no URL, an `https://` URL, an `http://` URL, a `www.` URL, trailing punctuation, an unsupported scheme, and a very long URL.

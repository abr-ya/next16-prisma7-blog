## Implementation Notes

This change is implemented as a planning-only structure slice. It does not change Prisma schema, migrations, runtime helpers, routes, or UI behavior.

## Final Planning Decisions

- Comment content remains stored as plain text.
- Plain `https://`, `http://`, and `www.` web URLs may become safe clickable links during rendering.
- `www.` links should normalize to `https://` hrefs while preserving visible comment text.
- Unsupported schemes such as `javascript:`, `data:`, `mailto:`, `tel:`, and relative URLs remain plain text.
- Generated user-content anchors should use `target="_blank"` and `rel="nofollow ugc noopener noreferrer"`.
- Runtime link rendering remains a separate implementation feature.

## Validation Notes

- `git diff --check` passed.
- `openspec validate feature-021-comment-link-handling-structure --strict` could not be run in this shell because the `openspec` CLI is not available.

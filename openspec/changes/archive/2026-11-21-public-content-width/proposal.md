# Proposal

## Why

The public `/tracks` list and `/tracks/[slug]` detail were pinned to the narrow reading width (`max-w-3xl`), while the surrounding public family (`/trips`, `/trips/[slug]`) already uses the wide content container. The detail page in particular wasted space for the map, file list, badges, and summaries.

## What Changes

- Add one shared content-width token, `content = max-w-5xl`, to the public width scale.
- Use it on `/tracks` and `/tracks/[slug]`, removing the local `max-w-3xl` / `max-w-5xl` wrappers so the width is decided in one place.
- Keep the detail page's readable prose — the description and the private note — inside the narrow reading width (`max-w-3xl`); the map, files, badges, and summaries use the full shared width.
- Leave `/trips` on its existing `wide` (`max-w-7xl`) container.

## Non-goals

- Changing `/trips`.
- A two-column detail layout.
- Any data, schema, or server change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the public track list and detail share a content width, and the detail keeps prose narrow.

## Impact

- `lib/site-content-width.ts`, `app/(public)/tracks/page.tsx`, `app/(public)/tracks/[slug]/page.tsx`.
- No schema, migration, API, or dependency changes.

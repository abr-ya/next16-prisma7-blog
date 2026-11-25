# Proposal

## Why

`feature-160` records the raw GPX source strings (`recordingApp`, `deviceName`), and the owner has no way to give them personal names. The follow-up needs a place to keep those names; this first slice prepares the storage and the owner-facing page, leaving creation, editing, and display resolution to the next slice.

## What Changes

- Add a `TrackSourceAlias` table owned by a user: `kind` (`APP` / `DEVICE`), the raw value, a normalized lookup key, and the display label. The unique key is `(userId, kind, rawKey)`, so one owner has at most one alias per raw source and kind.
- The normalized key is lowercase, trimmed, and whitespace-collapsed; the raw value keeps the original casing for display. Both limits are part of the contract: raw up to 120 characters, label up to 60.
- Add an owner-only page at `/my/source-aliases` with a title, a short explanation, the owner's stored aliases grouped by kind, and an empty state. Add a user-menu entry for it.
- No creation, editing, deletion, or application to badges and legends in this slice; the page is read-only.

## Non-goals

- Creating, editing, or deleting aliases.
- Using an alias in the track badge, the map legend, or an inline **Rename source** action.
- Applying aliases to existing or future tracks; that is read-time resolution in the next slice.
- Parsing changes, reparse, or baking labels into metadata.
- Public visibility of an owner's aliases.

## Capabilities

### New Capabilities

- `outdoor-track-source-aliases`: the owner-scoped alias store and the read-only source-names page.

### Modified Capabilities

None.

## Impact

- `prisma/schema.prisma` and one additive migration: the enum, the table, the `User` back-relation, the unique key, and the index. No existing row changes.
- `app/_data/track-source-aliases.ts` — the owner-scoped read for the page.
- `app/(public)/my/source-aliases/page.tsx` and a small presentational component — the page shell.
- `components/blog-pages/navbar-user-menu.tsx` and the navigation/workspace locales — the menu entry and the page title.
- No changes to parsing, public track payloads, or the alias resolution path.

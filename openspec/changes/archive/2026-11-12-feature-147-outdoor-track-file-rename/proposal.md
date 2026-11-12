# Proposal

## Why

A workout's GPX file keeps the name the device gave it at upload — `2026-11-11_07-30.gpx`, `activity_1234.gpx`, `Untitled track.gpx`. The owner cannot shape it afterwards: the only write path today replaces the whole file, so renaming a file means uploading the same recording again and paying a re-parse for it.

The name is not cosmetic. It is the name shown on the public track page next to the download button, and it is the name the owner gets when the file is downloaded — the download route serves `Content-Disposition` from the stored name. A name the owner did not choose is the one thing about the file that stays wrong.

## What Changes

- Add an owner-scoped action that renames the file asset of a workout the owner owns. It writes the display name only: the stored object, its provider key, and its URL stay exactly as they are, so the public download link never changes and no provider-side rename is needed.
- Add an owner-only rename control next to the file name on the public track page (`/tracks/[slug]`). It opens a small modal with one field for the file's base name; the `.gpx` suffix is fixed and not editable.
- The new name replaces the old one for everyone who sees the track, like the name it replaces — there is no separate owner-only name.
- The control is offered only where the track owns its GPX file. A workout built on a route borrows the route's file, which the route library and every other workout on that route also use, so such a workout gets no rename control and a direct save request for it is refused.
- The stored name is the download name, so the owner's download carries the new name while the download URL stays the same.
- Add spec scenarios that pin the owner-only control, the route-file protection, the fixed suffix, and the public visibility of the new name to the track capability, and a second delta that pins the stored-name-is-the-download-name rule to the file capability.

## Non-goals

- No rename of a route's own file, and no rename from a workout that borrows one.
- No rename in `/admin/files` and no rename in the track edit dialog.
- No provider-side rename (`UTApi.renameFiles`): the stored object, its key, and its URL are never touched.
- No separate private name for the owner: one name for every viewer.
- No change to how the file is uploaded, parsed, downloaded, or retired.
- No new database field and no migration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: new requirements cover the owner-only rename control on the public track page, the rename writing the stored name only, the route-file protection, and the refusal of an unusable name.
- `file-sharing-structure`: a new requirement covers the stored display name as a field of its own, kept separate from the provider identity, and as the name the application serves the file under.

## Impact

- `app/_actions/files.ts` — a new owner-scoped rename action. It lives in the `"use server"` module rather than in `app/_data/files.ts`, because that module exports a synchronous helper and a `"use server"` file may only export async functions.
- `components/track-pages/track-file-rename-button.tsx` — a new client component with the control and its modal.
- `app/(public)/tracks/[slug]/page.tsx` — renders the control for the owner.
- `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json` — the new copy in the trips namespace.
- `openspec/specs/outdoor-tracks/spec.md` and `openspec/specs/file-sharing-structure/spec.md` — new requirements: four in the track capability, one in the file capability.
- No database, API, dependency, or provider changes.

## Context

See `proposal.md` and the `outdoor-tracks` delta spec. `Track.metadata` currently stores parsed GPX summary timestamps and timed points as ISO absolute instants. The parser correctly preserves a `Z` timestamp as UTC, but formatting helpers omit `Intl.DateTimeFormat.timeZone`; therefore the runtime/browser timezone currently decides what a human sees. Track creation and editing are performed from `/admin/tracks`; public track and trip pages consume stored parsed metadata.

## Goals / Non-Goals

**Goals:**

- Make one track-owned IANA timezone the explicit source for every human-facing recording-time rendering.
- Preserve historical GPX and photo-coordinate data safely while allowing a later correction of display timezone.
- Keep the client-side browser timezone as a helpful default but retain validation and persistence authority on the server.

**Non-Goals:**

- Infer a timezone from geometry, call a geocoding/timezone service, add an AI agent, or reinterpret offset-less GPX values.
- Modify the absolute-time inputs used by the parser, day/matching logic, coordinate inference, or map rendering.
- Change current administrator/owner authorization rules; this feature fits the existing track-management surface and future access-policy work can reuse the field.

## Decisions

### Persist a nullable canonical IANA timezone on `Track`

Add a nullable `recordingTimezone` field on `Track`, validated against the server runtime's supported IANA identifiers before a focused timezone update. It belongs on the track record rather than parsed JSON because it is user-confirmed presentation policy, can change without reparsing the file, and needs a durable backward-compatible migration. Null remains only for legacy records until an administrator confirms a value.

Alternative: write the timezone into GPX metadata. That mixes user-selected display policy with parser output and risks losing the setting on a reparse, so it is rejected.

### Propose in the browser, save through a focused action, validate on the server

The client will read `Intl.DateTimeFormat().resolvedOptions().timeZone` after hydration and use it only to prefill a timezone dialog launched from the track row. The focused server action validates and persists the administrator's submitted value without requiring title, GPX, or other track edits. The selector uses the project's existing local UI controls and a curated/runtime-supported IANA list; no timezone package is required.

Alternative: automatically save the browser timezone. It recreates the implicit, machine-dependent behavior that caused the defect and prevents correction before first save.

### Centralize time formatting around an explicit timezone with UTC legacy fallback

Update the recording-time formatting helpers to accept a timezone explicitly and use it in `Intl.DateTimeFormat`. Projected track data will carry `recordingTimezone` to every administration, public-track, and hike/trip consumer that displays a time. A missing legacy value will use explicit `UTC`, accompanied by a missing/unconfirmed indication in administration rather than the executing browser timezone.

Alternative: pass a timezone only to the admin panel. That leaves public pages and trip coordinate-review information inconsistent, so it is rejected.

### Treat the timezone as display metadata only

The parser will continue to turn offset-bearing GPX values into ISO instants, and it will not receive the selected timezone as an input. Matching, duration, sort order, timeline storage, and map geometry will continue using epoch/ISO values. Any time labels shown in coordinate-review UI will use the selected timezone only at the final formatting boundary.

Alternative: shift parsed timestamps during import. That would corrupt absolute instants and can change coordinate matching, so it is rejected.

## Risks / Trade-offs

- A browser can report an unavailable or non-IANA timezone → present a safe selectable fallback and reject unsupported values server-side.
- A track crosses timezone boundaries → this first slice deliberately records one owner-confirmed presentation timezone; the coordinate-derived multi-zone follow-up remains backlog work.
- Existing tracks have no setting → preserve null at migration, display explicit UTC, and make the next edit require confirmation instead of guessing.
- Server/browser ICU timezone data can differ → use server validation and the persisted identifier as the authority; test representative identifiers including `Europe/Sofia`.
- Date labels can influence human coordinate review → preserve all matching inputs as absolute instants; updating ambiguous GPX/EXIF source timestamps and coordinate-review labels is deferred to dedicated candidates.

## Migration Plan

1. Add nullable `Track.recordingTimezone` through a forward Prisma migration; do not modify existing GPX metadata or timestamps.
2. Deploy server validation, the focused admin action, explicit formatter inputs, and projections before relying on local-time labels.
3. Existing tracks remain readable as clearly labelled UTC until an administrator saves a confirmed timezone; no bulk guess or reparse is performed.
4. Roll back UI/formatting only if necessary; the nullable field is additive and retained values are harmless presentation metadata. Do not roll back by shifting or regenerating parsed GPX data.

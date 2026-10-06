# Design

## Context

See [proposal.md](./proposal.md) for motivation. Both existing trip query projections order `HikesToTracks` by `assignedAt desc`. The public projection already reads each track's stored parse state to construct card and map data; the administrator dialog instead combines the hike association IDs with a separate all-track option list, losing association ordering.

## Goals / Non-Goals

**Goals:**

- Derive one deterministic trip-associated-track order from persisted successful GPX metadata.
- Use that result for both public track cards and the administrator attached-track list.
- Preserve reverse `assignedAt` ordering only as the stable fallback for tracks lacking a usable recording start.

**Non-Goals:**

- No persisted manual date, migration, GPX reparse, or change to standalone track listings.
- No client-side timezone conversion or browser-dependent ordering.

## Decisions

### Sort after reading stored parse state

The server-side trip projection will obtain each association's parsed recording start through the existing metadata reader, then sort dated entries by their UTC instant ascending. Entries with absent, failed, stale, or invalid starts compare after dated entries; stable sorting preserves the query's existing `assignedAt desc` fallback. This reuses the authoritative parse lifecycle and avoids sorting JSON metadata in Prisma or fetching GPX files during a normal render.

Alternative considered: adding a `recordingStart` database column and ordering in Prisma. It is unnecessary for this narrow display change, requires migration/backfill decisions, and duplicates existing versioned parsed metadata.

### Keep public and admin ordering on association data

The public `PublicHike` mapping will order linked associations before rendering cards and map inputs. The administrator dialog will render its attached list from the selected hike's ordered associations, while continuing to use the all-track option list only for unattached candidates. This prevents the client from reconstructing the order against a global list.

Alternative considered: independently sorting both UI components. That risks divergence in metadata validity and fallback behavior.

### Treat the instant as ordering data and timezone as presentation data

The sort key is the stored absolute GPX recording start instant. `recordingTimezone` remains presentation metadata, consistent with the existing rule that timezone selection does not rewrite GPX instants or timeline order.

## Risks / Trade-offs

- [Legacy/unparsed GPX tracks remain after dated tracks] → Keep reverse association order as a predictable fallback; a later dedicated feature can add an owner-confirmed manual date.
- [Malformed legacy JSON has an unusable start] → Treat it as undated rather than failing the trip page or dialog.
- [Public/admin query shapes diverge] → Put the ordering conversion beside the existing server-side hike data projection and cover both surfaces in validation.

## Migration Plan

1. Deploy the server/client ordering change without schema or data migration.
2. Existing pages immediately use stored metadata where present; undated associations retain the defined fallback.
3. Roll back by restoring reverse association ordering; no persisted data needs reversal.

## Context

See `proposal.md` and the delta specs. The current trip gallery contains an image viewer only. The admin photo dialog already renders EXIF extraction summaries, while coordinate candidate generation and approval live in the trip administration photo-management dialog. Photo EXIF and GPX timeline metadata, coordinate provenance, candidate generation, approval, rejection, and manual correction are already stored through existing helpers and actions.

## Goals / Non-Goals

**Goals:**

- Assemble a per-trip, per-photo detail projection that does not leak EXIF, coordinates, or review data outside its authorized audience.
- Reuse existing metadata extraction, formatting, and coordinate-matching/review primitives instead of reimplementing algorithms or duplicating persistence.
- Make review updates immediately consistent across the gallery details and existing map marker layer.

**Non-Goals:**

- Schema changes, public exposure of exact coordinates, changes to EXIF/GPX algorithms, or a replacement of the existing administrator trip-management surface.
- New inference policies, reverse geocoding, map editing, or changes to public marker eligibility.

## Decisions

### Derive one narrow authorized photo-detail projection per trip context

The server will derive a photo-detail capability only after loading the current session, published trip, linked photo, membership/ownership role, extracted metadata, and accepted coordinate state. A viewer may read details when they own the photo, own the trip, are an accepted participant, or are an administrator. EXIF-refresh and coordinate-review mutation authority is narrower: photo owner or administrator. The client will never receive the restricted fields or controls when its capability is absent.

Alternative: return full metadata with every public gallery item and hide controls in the client. This would expose sensitive GPS and operational information in page payloads and is rejected.

### Keep viewer details read-only and put mutations on photo cards

The photo card remains the entry point. Its existing large-photo dialog retains authorized read-only details. Eligible photo owners and administrators also receive compact `EXIF` and `GPX coordinates` card controls, each with a focused modal. The trip page owns map focus state and passes it to the map and viewer so selecting a valid coordinate pans/zooms the existing map rather than creating a second map implementation.

Alternative: create a standalone photo route. It would broaden public navigation, complicate trip-context authorization, and is outside this slice.

### Reuse existing EXIF and coordinate rules through narrow server actions

The card modals will call server actions that re-load session and trip/photo linkage. The EXIF action will reuse existing extraction and persistence. Coordinate actions will apply the existing candidate computation, approval, rejection, and manual override validation. Existing administrator actions may be factored behind authorization-neutral internal helpers, but action entry points shall enforce photo-owner-or-admin authority. No client-supplied coordinate candidate, track data, or authorization result is trusted.

Alternative: invoke the existing administrator-only actions directly. They cannot safely authorize a photo owner or trip creator and would keep the UI coupled to the admin surface.

### Preserve multi-image and metadata-source boundaries

The current `Photo` record can contain one to three images and stores aggregate metadata. The detail UI will label displayed metadata as the photo's extracted summary and will not promise image-by-image EXIF or coordinates. It will show only accepted coordinate provenance; pending/rejected candidates stay visible only to authorized reviewers.

## Risks / Trade-offs

- Exact coordinate disclosure can reveal sensitive locations → restrict metadata projection to authorized trip relationships and retain image-only output for others.
- Multi-image records can make an aggregated EXIF summary ambiguous → label it as photo-level extracted metadata and leave per-image modeling out of scope.
- Map focus can fail when a coordinate exists but the map layer is not currently rendered → display a non-actionable coordinate state instead of inventing a map control.
- Reusing extraction and candidate logic across surfaces risks authorization drift → centralize role checks in server-only helpers and validate direct action calls.

## Migration Plan

1. No database migration is required; consume existing metadata and coordinate fields.
2. Add read, EXIF-refresh, and coordinate-review capability helpers with server-authoritative action boundaries.
3. Add read-only viewer details, card modals, and valid-coordinate map focus behavior.
4. Roll back by removing the detail affordance and new action wiring; existing EXIF and approved coordinate records remain valid for the current map and admin workflows.

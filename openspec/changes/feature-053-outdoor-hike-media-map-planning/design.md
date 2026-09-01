## Context

The project has completed separate foundations for outdoor hikes, GPX-backed tracks, public track pages/downloads, GPX parsing/map geometry, photo records, and photo EXIF/GPS extraction. Current backlog ordering still suggests a standalone public photo gallery before hike associations, which conflicts with the desired public experience: the hike page should be the story surface.

## Goals / Non-Goals

**Goals:**

- Reorient the next outdoor implementation sequence around `/hikes/[slug]`.
- Keep track/photo records independently manageable while allowing many-to-many association with hikes unless implementation discovery proves one-to-many is sufficient.
- Make the public hike page an authenticated contribution surface for the hike creator and selected participants.
- Separate direct EXIF GPS map markers from later timestamp-based inferred coordinates.
- Preserve public visibility rules for hike, track, photo, and file metadata.

**Non-Goals:**

- This planning change does not implement schema migrations or UI.
- This planning change does not introduce a standalone public photo gallery.
- This planning change does not settle album UX beyond keeping it after basic hike photo association and ordering.

## Decisions

### Hike page first, gallery later

The next implementation slices should make published hike detail pages display linked published tracks and linked published photos before building global photo discovery. For signed-in users who are allowed to contribute to the hike, the same page should expose upload and management entry points in context.

Alternative considered: ship `/photos` listing/detail first. That would expose photos without trip context and force later work to retrofit the actual storytelling surface.

### Public contribution is scoped by hike membership

The hike creator should be able to manage the participant list for that hike and upload both tracks and photos from the public hike page. Participants should be able to upload photos for that hike from the public hike page, but track upload stays creator-only for now.

Alternative considered: allow any signed-in user to contribute to a published hike. That is simpler socially, but it weakens content ownership and moderation boundaries.

### Admin remains the universal override

Admin workflows should keep full management access to hikes, tracks, photos, associations, and participant lists. Public contribution actions should still enforce authorization server-side because hiding controls in the UI is only convenience, not a permission boundary.

Alternative considered: implement public contribution as purely client-visible controls backed by existing admin actions. That would blur the difference between admin permissions and hike membership permissions.

### Associations before combined map behavior

Implement hike-track and hike-photo association slices before combined hike maps and map photo markers. The map needs a stable set of linked records before it can render meaningful combined state.

Alternative considered: build a map over loose tracks/photos. That would make public behavior dependent on implicit matching and weaken admin control.

### Direct GPS before inferred coordinates

Direct EXIF GPS coordinates can be used as the first photo-marker source because the data is already extracted and stored. Timestamp-based matching should be a separate spike or structure feature because it needs timezone handling, interpolation rules, confidence, and admin review semantics.

Alternative considered: combine direct GPS markers and time inference in one slice. That would make the slice larger and blur trusted coordinates with inferred coordinates.

### Coordinate provenance is required

Future photo map markers should distinguish at least direct GPS coordinates from inferred track-time coordinates. Public UI can remain simple, but stored/read models need enough provenance to avoid presenting inferred locations as exact image metadata.

Alternative considered: store only latitude/longitude. That loses important trust and debugging context when inference is added.

### Associations should allow reuse

Use join tables for future hike-track and hike-photo associations so a track or photo can be reused across multiple hikes when needed. Admin UX can still present the common case as "attach to this hike" without forcing global exclusivity.

Alternative considered: store a nullable `hikeId` on track/photo records. That is simpler initially, but it makes shared routes, overlapping trip reports, and later albums harder to represent.

### Inferred coordinates need admin approval before public display

Timestamp-derived photo coordinates should be created as candidates and require admin approval before appearing on public maps. Direct EXIF GPS can be shown when visibility rules allow it because it is source metadata, while inferred coordinates carry extra uncertainty.

Alternative considered: publish inferred coordinates automatically above a confidence threshold. That might be acceptable later, but it is too easy to misplace photos when camera clocks, GPX timestamps, or timezones are wrong.

### Hike photo ordering starts on the association

Store initial ordering on the hike-photo association so the same photo can appear in a different narrative position across different hikes. Album/grouping behavior can build on top of that later.

Alternative considered: store one global order on the photo record. That does not work well once photos can belong to more than one hike or album.

## Proposed Slice Order

The next numbered implementation sequence should start by creating explicit hike-media associations, then build contributor permissions and uploads on top of those associations:

1. `outdoor-hike-track-association`
2. `outdoor-hike-photo-association`
3. `outdoor-hike-participants`
4. `outdoor-hike-public-photo-upload`
5. `outdoor-hike-owner-track-upload`
6. `outdoor-hike-combined-track-map`
7. `outdoor-photo-gps-map-markers`
8. `outdoor-photo-track-time-matching-spike`
9. `outdoor-photo-track-time-inferred-coordinates`
10. `outdoor-photo-manual-ordering`
11. `outdoor-photo-albums-structure`
12. `outdoor-photos-public-gallery` remains a later candidate only if standalone browsing still adds value.

## Risks / Trade-offs

- Association model may need many-to-many joins even if early content is one hike per track/photo -> Mitigation: choose a join table unless existing Prisma constraints strongly argue otherwise.
- Public contribution can accidentally become a broad upload surface -> Mitigation: require signed-in users and check creator/participant/admin permissions in server actions.
- Participants uploading tracks could create route trust and attribution issues -> Mitigation: keep track upload creator/admin-only until a later explicit feature broadens it.
- Hike pages can become visually crowded once tracks, maps, and photos appear together -> Mitigation: implement in narrow sections and validate public layout manually.
- Time inference can produce misleading coordinates if timestamps or timezones are wrong -> Mitigation: keep it behind a separate spike and require provenance/confidence.
- Private file/provider URLs could leak through map or photo rendering -> Mitigation: public data helpers must expose only app-owned URLs and stored metadata.

## Migration Plan

No runtime migration is performed by this planning change. Later implementation slices that add association tables or inferred coordinate fields should include Prisma migrations and preserve existing hike, track, photo, and file asset records.

Rollback for this planning change is limited to reverting OpenSpec/backlog documents. Later implementation slices should define their own rollback and data preservation notes.

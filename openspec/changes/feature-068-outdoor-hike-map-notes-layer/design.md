## Context

See proposal.md for motivation. The existing `Hike` model owns tracks and photos, and `/hikes/[slug]` already supplies a visibility-safe map view model to a client Leaflet component. Feature-067 added a day selector that depends on explicit timezone-safe date membership; notes have no extraction source, so their day needs an intentional admin-entered calendar-date value rather than an inferred timestamp.

## Goals / Non-Goals

**Goals:**

- Add a small `HikeNote` persistence model owned directly by `Hike`.
- Manage notes through the established admin hike surface and server-action authorization pattern.
- Extend the public map view model with minimal safe note-marker data and preserve the existing map fit, grouping, and day-filter behavior.

**Non-Goals:**

- Separate note routes, public creation/editing, participants, media attachments, rich-text editing, coordinate picking/dragging, or route-segment attachment.
- Changing existing track/photo coordinate provenance, visibility rules, or day assignment semantics.

## Decisions

### Store one independently managed note per hike

Add `HikeNote` with `hikeId`, `title`, nullable `body`, nullable `latitude` and `longitude`, nullable calendar-day key, `status`, and timestamps. `Hike` receives a cascading `notes` relation. The day is stored in a canonical date-only representation (`YYYY-MM-DD` or equivalent date-only-safe value) after validating it against the hike's inclusive UTC day keys; it is not stored as a locally interpreted timestamp.

Alternative considered: store notes in a JSON field on `Hike`. Rejected because note-level status, validation, lifecycle, map reads, and later attachments would be fragile and impossible to index or manage independently.

### Use explicit note publication rather than inheriting only hike publication

Use a `HikeNoteStatus` with `DRAFT` and `PUBLISHED`. Admins can prepare notes before exposing them; public reads require both `Hike.status === PUBLISHED` and `HikeNote.status === PUBLISHED`.

Alternative considered: make every note public when its hike is published. Rejected because route decisions and private travel context need a deliberate public gate.

### Keep coordinate and day assignment independently optional

Latitude and longitude are either both present and within geographic bounds or both absent. A published note without coordinates stays a valid record but does not create a map marker. A note day is separately optional; when absent, a coordinate-bearing public note is shown only in all-days mode so the day selector cannot misrepresent it.

Alternative considered: require both a coordinate and a day on every note. Rejected because general hike notes and undated locations are useful, while filtering must remain conservative.

### Put mutation logic on the server and map interaction in the client

Admin note actions authenticate and authorize via the existing admin helper before validating data, writing with Prisma, and revalidating affected admin/public hike paths. The server page shapes a public note marker view model and never sends drafts or lifecycle fields to the browser. The existing client map renders markers, includes note markers in selected-layer bounds, and filters them by their deliberate day key.

Alternative considered: load notes through a client API call. Rejected because the current page already has server-owned visibility filtering and a client fetch would add an avoidable authorization boundary.

## Risks / Trade-offs

- Invalid manual coordinates or day values could create misleading map output → validate coordinate pair/ranges and date membership server-side; use inputs only for early feedback.
- Public note bodies may contain more text than a compact popup can comfortably display → preserve plain-text output and constrain popup layout without truncating stored content.
- Deleting notes removes contextual history → require the shared styled confirmation dialog; no unrelated hike/media records are removed.
- A schema migration affects deployment order → deploy the additive migration and generated Prisma client before server code that queries notes; rollback application code safely while keeping unused empty/additive tables.

## Migration Plan

1. Add the enum/model/relation in Prisma and generate an additive migration without altering existing hike, track, or photo records.
2. Regenerate the Prisma client and deploy the migration before the note read/write code.
3. Deploy admin actions and UI, then public map projection and rendering.
4. On rollback, remove note UI and reads first; retain note rows/table until a separately approved data-removal migration exists.

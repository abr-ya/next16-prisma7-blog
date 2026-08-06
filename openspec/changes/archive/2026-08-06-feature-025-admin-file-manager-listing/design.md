## Context

The admin files page (`/admin/files`) currently shows:
- Three stat cards: My Files count, Storage Used, Tracked Files count
- Upload form in a left-side card
- UploadThing usage points in a right-side card
- Simple table with 50 most recent tracked files, showing: Name, Type, Size, Purpose, Uploaded date

The table query uses `listTrackedFileAssets()` which returns all ACTIVE files sorted by `uploadedAt desc` with a hard limit of 50. There's no pagination, search, or filtering.

The proven admin table pattern exists in `VideosTable` component, which uses:
- `@tanstack/react-table` with `DataTable` wrapper from `components/ui`
- Client-side pagination with configurable page size
- Client-side filtering (channel dropdown)
- Sortable columns with `ArrowUpDown` buttons
- Action buttons per row

The `FileAsset` model includes fields useful for filtering/display:
- `purpose`: enum (ADMIN_UPLOAD, ARCHIVE_ATTACHMENT, VIDEO_ATTACHMENT, etc.)
- `visibility`: enum (PRIVATE, UNLISTED, PUBLIC)
- `status`: enum (ACTIVE, DETACHED, PENDING_DELETE, DELETED)
- `ownerUserId`: relation to User (for owner name display)
- `fileKey`, `customId`, `name`, `mimeType`, `sizeBytes`, `url`

## Goals / Non-Goals

**Goals:**

- Add client-side pagination to file table using the proven `DataTable` pattern.
- Add search by filename with client-side text filtering.
- Add filters by purpose, visibility, and status using dropdowns similar to channel filter in videos table.
- Enhance metadata display: show custom ID, file key, owner name, visibility/status badges.
- Keep existing stats cards, upload form, UploadThing usage points intact.
- Use existing `FileAsset` model without schema changes.

**Non-Goals:**

- No file preview capability (deferred to feature-026).
- No file deletion controls (deferred to feature-027).
- No bulk actions, file editing, per-user views, categories/tags.
- No server-side pagination or search (keep client-side for simplicity).
- No UploadThing provider integration changes.

## Decisions

### Decision: Use client-side pagination and filtering

Follow the `VideosTable` pattern with `@tanstack/react-table` and client-side filtering. Query all ACTIVE files on page load and filter/paginate in the client.

Rationale: File count is expected to be manageable (hundreds, not thousands). Client-side approach matches existing videos table and avoids adding search API routes. Performance is acceptable for current scale.

Alternative considered: Server-side pagination with search params. That would add route complexity and API surface for a problem that doesn't exist yet.

### Decision: Extract FilesTable component

Create a new `components/admin-pages/files-table.tsx` client component similar to `VideosTable`, consuming file data as props from the server page.

Rationale: Separates client interactivity from server data fetching. Matches existing admin table structure.

Alternative considered: Keep table inline in page.tsx. That would make the page client-only and harder to compose with server-fetched stats.

### Decision: Show owner name via extended query

Extend `listTrackedFileAssets()` to include `user: { select: { name: true } }` in Prisma query so owner name is available for display.

Rationale: File ownership is useful context for admins. The join cost is negligible.

Alternative considered: Show only user ID. That's less useful and doesn't help admins identify files quickly.

### Decision: Add filters for purpose, visibility, status

Add three separate dropdown filters (similar to channel filter in videos table) that can be combined. Use special "__all__" values for "All purposes", "All visibilities", "All statuses".

Rationale: These are the key categorization fields in `FileAsset` schema. Admins need to narrow down files by these dimensions.

Alternative considered: Single combined filter or tags. That's harder to discover and use than separate labeled dropdowns.

### Decision: Keep 50-row hard limit for now

Continue fetching top 50 tracked files in the initial query. Pagination happens client-side within those 50 rows.

Rationale: Avoids unbounded queries while the file table proves useful. If 50 becomes limiting, a future feature can lift or paginate the server query.

Alternative considered: Fetch all files. That could cause performance issues as file count grows.

## Risks / Trade-offs

- Client-side filtering only works within fetched rows (50) → Accept this limit for now; monitor usage and lift limit in a follow-up if needed.
- Three separate filter dropdowns can clutter UI → Use responsive layout (flex wrap) and clear filter state visibility.
- Owner name adds a join to every file row → The cost is minimal; query still returns quickly with 50 rows.
- Search by filename is case-sensitive or case-insensitive? → Use case-insensitive search with `.toLowerCase()` for better UX.

## Migration Plan

No schema migrations or data changes required. This is a pure UI/component enhancement using existing data.
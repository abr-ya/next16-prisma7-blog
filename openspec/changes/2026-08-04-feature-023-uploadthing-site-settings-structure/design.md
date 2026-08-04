## Context

The app is a personal blog/content hub with UploadThing-backed file uploads. Current file foundation includes `FileAsset` for tracking uploaded files, a dedicated `fileUploader` route with per-user quota enforcement (512 MB limit), and a minimal admin files page at `/admin/files` showing the current user's file count and basic file list.

Existing configuration:
- Per-file upload limit: 64 MB (`GENERAL_FILE_UPLOAD_MAX_SIZE`)
- Per-user storage limit: 512 MB (`GENERAL_FILE_USER_STORAGE_LIMIT_BYTES`)
- File route: `fileUploader` in `app/api/uploadthing/core.ts`
- Legacy image route: `imageUploader` (not tracked as `FileAsset`)

The accepted auth role foundation provides persisted `user` and `admin` roles plus server-only helpers such as `requireAdmin()`. The broader `/admin` layout remains an authenticated creator workspace, so sensitive site-wide settings need their own role-gated boundary.

This feature is a structure slice. It defines settings visibility, access control, and future management boundaries before follow-up implementation features create settings UI, editable controls, or UploadThing API integration.

## Goals / Non-Goals

**Goals:**

- Define the first admin-only site-wide file/UploadThing settings capability and its route boundary.
- Define which parameters should be visible to administrators vs remain server-only.
- Define read-only vs editable settings at the contract level.
- Define provider-sourced metadata that may require UploadThing API calls vs app-computed values.
- Keep implementation slices small and ordered.

**Non-Goals:**

- No settings UI implementation, configuration editing, or UploadThing API integration in this slice.
- No Prisma schema or migration change in this slice unless a later approved implementation needs persisted configuration tracking.
- No modification to existing file upload routes, quota logic, or `FileAsset` structure.
- No settings access for ordinary authenticated creator users.
- No new file storage providers or external service integration.
- No per-file management controls; those remain part of the planned `feature-025-admin-file-manager-polish`.

## Decisions

### Decision: Use an admin-only settings surface

Future settings UI should live under `/admin/settings` or `/admin/settings/files`, but the route/page/action boundary must call `requireAdmin()` or an equivalent server-only role helper. It must not rely on the `/admin` layout's session-only creator workspace gate.

Alternative considered: put settings on the existing `/admin/files` page. That would mix per-user file browsing with site-wide policy, making it harder to separate admin-only controls from creator-accessible surfaces.

### Decision: Separate structure from implementation

This feature should define the settings contract only. Follow-up slices should implement settings UI display, editable controls, UploadThing API integration for provider-sourced data, and configuration persistence if needed.

Alternative considered: implement a simple settings page immediately. That skips visibility, edit boundaries, and provider integration decisions and is too risky for a first settings slice.

### Decision: Define visible parameter categories

The planned settings model should display:

**App configuration (read-only in first slice):**
- Canonical file URL base (derived from UploadThing configuration)
- Per-file upload size limit (`GENERAL_FILE_UPLOAD_MAX_SIZE`)
- Per-user storage quota limit (`GENERAL_FILE_USER_STORAGE_LIMIT_BYTES`)
- Allowed file types/extensions for general file route

**App-computed usage (read-only):**
- Total stored `FileAsset` count across all users
- Total storage used by active `FileAsset` records (sum of `sizeBytes` where `status = ACTIVE`)
- Top users by file count or storage usage (optional, may require aggregation query)

**Provider-sourced metadata (read-only, requires UploadThing API):**
- UploadThing account storage limit (if available via API)
- UploadThing account storage used (if available via API)
- UploadThing plan name or tier (if available via API)

**Provider policy (informational):**
- Known UploadThing routes in the app (`imageUploader`, `fileUploader`)
- Which routes are tracked as `FileAsset` vs legacy/untracked

Alternative considered: only show app-computed values. That would miss provider-level context like UploadThing account limits, which are useful for understanding when the app is approaching provider-imposed boundaries.

### Decision: Keep configuration values server-only by default

Sensitive UploadThing configuration such as secret keys, webhook URLs, and internal routing details should remain server-only. Settings UI should only expose values that are safe for admin visibility and do not weaken security if leaked.

Alternative considered: expose all UploadThing configuration. That risks leaking provider secrets or internal routing details.

### Decision: Defer editable controls to implementation slice

First settings display should be read-only. A follow-up implementation can add editable controls for per-file limits, per-user quotas, or allowed file types after the read-only contract is proven.

Alternative considered: make settings editable immediately. Editable settings require validation, safe reload/restart behavior, and possible migration to database-backed configuration, which is too much scope for a structure slice.

### Decision: Defer per-file download audit to separate feature

Settings should not include per-file access logs, download counts, or file-specific audit. Those remain part of the planned `feature-024-public-file-downloads` and `feature-025-admin-file-manager-polish` features.

Alternative considered: include per-file audit in settings. That couples settings to file browsing and makes settings display too heavy.

## Risks / Trade-offs

- UploadThing API integration may fail or return stale data → Settings UI should gracefully handle missing provider-sourced metadata and clearly label app-computed vs provider-sourced values.
- Ordinary creator users can access `/admin` today → Gate settings routes/actions with `requireAdmin()` rather than the admin layout alone.
- Hardcoded limits in `lib/file-upload-limits.ts` may become stale → Settings should display current runtime values, not documentation or comments.
- Total storage computation may be slow on large datasets → Defer optimization to implementation slice; consider caching or pre-computed aggregates if needed.
- Provider-sourced metadata may not be available in UploadThing free tier → Settings should clearly distinguish unavailable vs missing data.

## Migration Plan

1. Accept this structure as an OpenSpec capability.
2. Implement a follow-up settings-display slice that creates the admin-only route/page boundary and renders read-only settings.
3. Add UploadThing API integration for provider-sourced metadata in a separate approved slice if provider data proves useful.
4. Add editable controls only after a separate design defines validation, persistence, and reload boundaries.

Rollback for this structure slice is documentation-only: archive is reversible through a follow-up spec change. No database or runtime rollback is expected.

## Open Questions

- Should the first implementation call UploadThing API for provider-sourced metadata, or defer that to a later slice?
- Should per-user storage limit be configurable per-user (e.g., higher limit for admins) or remain a single site-wide constant?
- Should settings include a breakdown of storage by file purpose (`ADMIN_UPLOAD`, future purposes) or remain a single total?
- Should settings display the legacy `imageUploader` route behavior, or only focus on tracked `FileAsset` routes?
- Should editable controls write to environment variables, a database-backed config table, or a server-side JSON file?

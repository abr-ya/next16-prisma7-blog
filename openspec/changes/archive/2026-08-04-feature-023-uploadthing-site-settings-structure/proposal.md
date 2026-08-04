## Why

After the file-sharing foundation is in place and admin roles are defined, administrators need a planned settings surface to view and manage site-wide UploadThing parameters before adding file-management features like cleanup, limits enforcement, or provider policy controls. Now that persisted `admin` role storage exists and `FileAsset` provides basic file tracking, the next safe step is to define the settings contract, access boundary, displayed parameters, and future management controls before implementation slices create actual settings UI or configuration changes.

## What Changes

- Define an admin-only UploadThing/file settings structure for `/admin/settings` or a similarly scoped admin settings surface.
- Specify which site-wide file parameters should be visible to administrators, including canonical file URLs, total stored files, storage usage, file count limits, and UploadThing provider policy.
- Define read-only vs editable parameters at the contract level.
- Require role-gated access using the existing persisted `admin` role helpers rather than the broader authenticated `/admin` creator workspace boundary.
- Define which UploadThing configuration values should remain server-only vs exposed in admin UI.
- Identify follow-up implementation slices for settings display, editable controls, usage tracking, and provider integration.

### Non-goals

- Do not implement settings UI, configuration editing, or provider API calls in this structure slice.
- Do not add Prisma schema changes or migrations in this structure slice unless the planning uncovers an unavoidable tracking requirement that must be separately approved.
- Do not modify existing UploadThing configuration or file route behavior.
- Do not expose file settings to ordinary authenticated users.
- Do not introduce new file storage providers or external service integration in this slice.
- Do not include per-file management controls; those remain part of the planned admin file manager polish feature.

## Capabilities

### New Capabilities

- `admin-uploadthing-site-settings`: Defines role-gated admin settings planning for site-wide UploadThing/file parameters, displayed values, edit boundaries, and provider policy visibility.

### Modified Capabilities

None.

## Impact

- Affected route surface: future admin-only settings page under `/admin/settings` or similar.
- Affected auth surface: settings access must use the persisted `admin` role, not only authenticated-session access.
- Affected data: `FileAsset` records, UploadThing configuration from `lib/uploadthing.ts`, and provider-level metadata from UploadThing API.
- Affected docs/specs: OpenSpec planning artifacts and accepted specs after archive.
- No public routes, schema migrations, new dependencies, or generated Prisma files are expected in this structure slice.

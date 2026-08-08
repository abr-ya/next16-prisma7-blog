## ADDED Requirements

### Requirement: Admin file deletion controls

The admin file manager SHALL allow administrators to mark active tracked file assets for deletion through a safe lifecycle transition.

#### Scenario: Active file exposes delete action

- **WHEN** an administrator views an active tracked file row on `/admin/files`
- **THEN** the row SHALL expose a delete action
- **AND** the action SHALL require confirmation before submitting the deletion mutation

#### Scenario: Delete action marks file pending delete

- **WHEN** an administrator confirms deletion for an active tracked file
- **THEN** the system SHALL update that `FileAsset.status` to `PENDING_DELETE`
- **AND** it SHALL set `FileAsset.deletedAt` to the deletion time
- **AND** it SHALL keep the `FileAsset` database record for audit and future cleanup

#### Scenario: Delete action refreshes admin file state

- **WHEN** a tracked file is marked pending delete from `/admin/files`
- **THEN** the admin file manager SHALL refresh its file list and stats
- **AND** the default active-file view SHALL no longer include that file
- **AND** status filters SHALL still allow the administrator to view the pending-delete record

#### Scenario: Non-active files cannot be deleted again

- **WHEN** an administrator views a file whose status is `DETACHED`, `PENDING_DELETE`, or `DELETED`
- **THEN** the file row SHALL NOT expose an enabled delete action
- **AND** submitting a deletion mutation for that file SHALL NOT transition it again

#### Scenario: Deletion is admin authorized server-side

- **WHEN** a file deletion mutation is submitted
- **THEN** the server SHALL verify the current user has the persisted admin role before changing `FileAsset` lifecycle fields
- **AND** unauthenticated or non-admin users SHALL NOT be able to mark files pending delete

### Requirement: File deletion cleanup boundary

The admin file deletion workflow SHALL preserve provider storage until a future cleanup implementation explicitly removes provider objects.

#### Scenario: Provider object is not deleted

- **WHEN** an administrator marks a tracked file pending delete
- **THEN** the system SHALL NOT call the UploadThing provider delete API in this slice
- **AND** it SHALL preserve the stored provider metadata needed for future cleanup

#### Scenario: Legacy URL-only uploads are excluded

- **WHEN** the admin file deletion workflow is available
- **THEN** it SHALL apply only to tracked `FileAsset` records
- **AND** it SHALL NOT provide deletion controls for legacy URL-only image uploads that are not represented by `FileAsset`

#### Scenario: Non-active files remain unavailable through active download path

- **WHEN** a tracked file is marked `PENDING_DELETE`
- **THEN** the existing app-owned download route SHALL NOT serve it as an active downloadable file
- **AND** preview actions SHALL NOT be enabled for that non-active file

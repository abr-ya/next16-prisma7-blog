## Context

The admin file manager already lists tracked `FileAsset` records, supports status filtering, and can preview/download active files through app-owned routes. The Prisma model already contains the lifecycle states needed for a safe first deletion slice: `ACTIVE`, `DETACHED`, `PENDING_DELETE`, and `DELETED`, plus `deletedAt`.

This change should expose deletion as an admin file manager action without adding provider cleanup. Existing download behavior only serves active files, which matches the desired preservation boundary: cleanup-pending files remain auditable but are no longer downloadable or previewable through the app-owned active-file path.

## Goals / Non-Goals

**Goals:**

- Add a row-level delete action for active tracked files in `/admin/files`.
- Persist deletion as a lifecycle transition on `FileAsset` instead of removing the database row.
- Keep the file manager filterable by status so administrators can inspect cleanup-pending records.
- Revalidate `/admin/files` after deletion so stats and listings update.
- Require server-side admin authorization for the deletion mutation.

**Non-Goals:**

- Do not call the UploadThing provider delete API.
- Do not add a cleanup worker, retention scheduler, restore action, hard delete, or bulk delete.
- Do not inspect rich text, posts, docs, videos, or metadata for file references in this slice.
- Do not add schema fields or migrations.
- Do not make legacy URL-only image uploads deletable.

## Decisions

1. Use `PENDING_DELETE` as the first admin deletion target state.

   `PENDING_DELETE` communicates that provider cleanup has not happened yet. `DETACHED` remains available for future replacement/detach workflows where a file is no longer attached but not explicitly queued for deletion. Alternative considered: move to `DETACHED`; rejected because the user-facing action is deletion and should be distinguishable from passive detachment.

2. Implement deletion as a server-side admin mutation.

   The mutation should require `requireAdmin()` before updating the row. The admin layout may already gate the page, but the action itself is sensitive and should not depend on UI hiding. Alternative considered: allow any authenticated owner to delete own files; rejected because the backlog item is specifically admin file deletion controls.

3. Update only active files.

   The mutation should transition `ACTIVE` files to `PENDING_DELETE` and set `deletedAt` to the mutation time. Files already `DETACHED`, `PENDING_DELETE`, or `DELETED` should not be transitioned again. This keeps repeated submits idempotent from a data-preservation perspective and avoids changing audit timestamps accidentally.

4. Keep provider URLs out of deletion UI.

   The UI can identify files by name and app metadata, but it should submit the `FileAsset.id` to the server action. It should not expose raw provider delete URLs or imply physical deletion from storage.

5. Preserve current download and preview boundaries.

   Existing app-owned download lookup rejects non-active files. The table can still show non-active files when the status filter is changed, but delete and preview actions should only be active when allowed by lifecycle state.

## Risks / Trade-offs

- Cleanup-pending files still exist in UploadThing storage -> The UI and specs must label this as a lifecycle transition, not physical provider deletion.
- Admin may expect deleted files to disappear forever -> Default `ACTIVE` status filtering keeps them out of the initial active view while `All statuses` and `PENDING_DELETE` filters preserve audit visibility.
- A stale browser submit could delete a file already transitioned by another admin -> The server action only updates active files and returns a clear failure or no-op state for non-active records.
- Existing tracked-file count currently reflects the fetched list -> Implementation should ensure displayed active counts still describe active records after non-active records become listable for auditing.

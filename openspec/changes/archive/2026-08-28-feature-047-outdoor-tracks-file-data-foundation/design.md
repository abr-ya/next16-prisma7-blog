## Context

See proposal.md for motivation. The project already has `Hike` outdoor content (`feature-045`), a first-party `FileAsset` model, a general `fileUploader` route, admin file management, and hike admin patterns under `app/_data/hikes` and `components/admin-pages/hikes-admin-panel.tsx`. There is no `Track` model or GPX-specific upload path yet.

## Goals / Non-Goals

**Goals:**

- Add the first durable track model and admin workflow without depending on hikes, maps, or GPX parsing.
- Require every track to reference exactly one validated GPX `FileAsset`.
- Keep admin mutations authenticated and server-side.
- Store a nullable metadata shell for later parsing without filling it in this slice.
- Follow existing admin table/form/page patterns rather than introducing a new admin architecture.

**Non-Goals:**

- No public track pages, public navbar links, or publish-time file visibility rollout beyond storing track status.
- No GPX geometry/stat extraction, map components, hike associations, or photo workflows.
- No orphan-file cleanup automation beyond leaving uploaded GPX files in the existing file manager lifecycle.

## Decisions

1. Model tracks as a standalone Prisma `Track` record.
   - Fields: `id`, `title`, `slug`, `description`, `status`, `fileAssetId`, `metadata`, `userId`, `createdAt`, `updatedAt`.
   - `fileAssetId` is required and unique so one GPX file maps to at most one track.
   - `metadata` is nullable JSON and remains empty in this slice.
   - Rationale: gives later hike/map/parsing features a stable foreign-key target without designing those models early.
   - Alternative considered: store GPX only as `FileAsset` without a track wrapper. Rejected because tracks need editable title/slug/status independent of raw file metadata.

2. Use enum-style status for tracks.
   - Proposed statuses: `DRAFT`, `PUBLISHED`.
   - Rationale: mirrors hikes and gives later public slices an explicit visibility boundary.
   - Alternative considered: infer visibility only from `FileAsset.visibility`. Rejected because content status and file visibility should stay separate until the public download slice defines their sync rules.

3. Add a dedicated UploadThing route for GPX track uploads.
   - Route slug: `trackGpxUploader`.
   - Records `FileAsset` rows with `purpose = TRACK_GPX` and default `visibility = PRIVATE`.
   - Validation at upload boundary:
     - filename ends with `.gpx` (case-insensitive), and
     - MIME type is one of `application/gpx+xml`, `application/xml`, `text/xml`, or empty/unknown with a `.gpx` filename, and
     - file body passes a light GPX sniff (`<gpx` present near the start after optional XML declaration/whitespace).
   - Reuse existing per-user storage quota checks.
   - Rationale: keeps GPX constraints out of the generic `fileUploader` route and matches the project's separate image vs general-file upload split.
   - Alternative considered: reuse `fileUploader` and validate only when creating a track. Rejected because invalid GPX files would still enter the general file pool.

4. Keep track create/edit as an admin modal workflow with embedded upload.
   - Create flow: upload GPX first, then submit track fields with the returned `fileAssetId`.
   - Edit flow: metadata fields can be updated any time; GPX replacement uploads a new `TRACK_GPX` file and updates `fileAssetId`.
   - Rationale: one complete admin workflow without forcing admins through `/admin/files` first.
   - Alternative considered: select an existing file from the file manager. Rejected for poor track-specific UX and weaker GPX validation guarantees.

5. Preserve uploaded GPX files when a track is deleted.
   - Deleting a track removes only the `Track` row.
   - The linked `FileAsset` remains `ACTIVE` in the file manager for now.
   - Rationale: avoids accidental data loss before association/cleanup rules exist.
   - Alternative considered: auto-delete or auto-detach the file on track delete. Deferred because lifecycle rules may change once hike associations and public downloads exist.

6. Put mutations in the existing server-side data/action style.
   - Track helpers/actions live alongside hikes under `app/_data`.
   - Server-side validation must confirm:
     - slug uniqueness,
     - referenced `fileAssetId` exists,
     - referenced file has `purpose = TRACK_GPX`,
     - referenced file is `ACTIVE`,
     - referenced file is not already bound to another track (except on update of the same track).

## Risks / Trade-offs

- [Risk] Replacing a GPX file can leave older unused `TRACK_GPX` assets in storage. -> Mitigation: accept for this slice; later cleanup or reuse rules can be added with hike/public workflows.
- [Risk] Light GPX sniffing may accept some invalid XML or reject unusual but valid GPX exports. -> Mitigation: keep validation minimal and expand only when parsing (#9) needs stricter guarantees.
- [Risk] Track delete without file cleanup may clutter the file manager. -> Mitigation: files remain visible/manageable through existing admin file tools.
- [Risk] `PUBLISHED` tracks still point at private GPX files until the public download slice. -> Mitigation: document as expected; public behavior belongs to the next outdoor track slice.

## Migration Plan

1. Add Prisma enums/model updates and generate a migration.
2. Regenerate the Prisma client through the existing project flow.
3. Add GPX upload route/helpers and track server actions.
4. Add `/admin/tracks` UI and admin navigation.
5. Validate with `npm run tsc` and `npm run lint`; ask the user to run `npm run build` locally because this changes Prisma schema and upload routes.

## Open Questions

- None that block this slice. Public file visibility sync and parsed metadata population are intentionally deferred to later outdoor backlog items.

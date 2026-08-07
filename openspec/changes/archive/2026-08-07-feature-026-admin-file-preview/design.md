## Context

`/admin/files` already lists tracked `FileAsset` records with metadata, filters, sorting, pagination, and a download link through `/files/{fileId}/download`. That download route is the correct source for preview content because it preserves app-owned access checks instead of exposing provider URLs directly.

## Goals / Non-Goals

**Goals:**

- Add an admin preview action for image, PDF, and text-like tracked files.
- Keep preview behavior inside the existing `/admin/files` client table.
- Reuse the app-owned download route for preview URLs.
- Show clear non-previewable state for unsupported MIME types.

**Non-Goals:**

- No database schema or migration work.
- No provider URL, signed URL, UploadThing storage policy, or public sharing changes.
- No deletion, detach, cleanup, or file lifecycle mutation.
- No preview support for arbitrary binary/media formats beyond image, PDF, and text-like files.

## Decisions

- Use a client-side dialog owned by the files table.
  - Rationale: the table is already a client component, and preview is a local interaction over a selected row.
  - Alternative considered: a separate route. That would be useful for shareable previews, but this slice is admin-only and does not need URL-addressable preview pages.

- Use `/files/{fileId}/download` as the preview source.
  - Rationale: this preserves existing file visibility and access checks and avoids exposing UploadThing provider URLs in new UI.
  - Alternative considered: use `file.url` directly. That would bypass the app-owned boundary and weaken later domain isolation work.

- Determine previewability from MIME type.
  - Rationale: `FileAsset.mimeType` is already stored and sufficient for this UI decision.
  - Alternative considered: extension-based detection. Extensions are less trustworthy and duplicate data already stored on the asset.

- Fetch text previews client-side with a size cap.
  - Rationale: images and PDFs can render directly from the download route, while text needs response content. A cap keeps the dialog responsive for large files.
  - Alternative considered: a server-side text preview endpoint. It may be useful later for stronger byte-range handling, but it is extra surface area for this narrow slice.

## Risks / Trade-offs

- Large text files could be expensive to preview → only attempt text preview under a client-side size threshold and show a download fallback otherwise.
- Browser PDF rendering varies → embed the existing download route and keep the download link visible.
- Unsupported MIME types may frustrate admins → keep the action visibly disabled or explain that the file can still be downloaded.
- Access behavior depends on the existing download route → do not introduce direct provider URLs in the preview UI.

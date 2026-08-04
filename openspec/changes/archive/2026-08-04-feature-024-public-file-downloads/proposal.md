# feature-024-public-file-downloads

## Status
Proposed

## Context

The current file upload foundation (`feature-015-file-sharing-structure`) stores `FileAsset` records with provider URLs from UploadThing. Public pages that need to expose files currently have two options:

1. Render the UploadThing provider URL directly (`FileAsset.url`)
2. No stable app-owned download route exists yet

This creates several gaps:

- **No URL stability**: If a file moves between providers or the provider URL format changes, all external references break
- **No access control**: The provider URL is either public or not — fine-grained access checks (authenticated users only, admin-only, expiring links) aren't possible
- **No download audit**: The app cannot track who downloaded what file or when
- **No content disposition control**: Provider URLs may display files inline when attachment downloads are preferred
- **Provider lock-in**: Direct provider URLs couple the app's public surface to UploadThing's URL scheme

This proposal defines app-owned public download routes that proxy file assets through the app's domain, enabling stable URLs, access checks, download logging, and provider independence.

## Proposal

Add public download routes for `FileAsset` records that serve files through app-controlled endpoints instead of exposing provider URLs directly.

### Key decisions

1. **Route structure**: `/files/[fileId]/download` for stable file identity
   - Uses the `FileAsset.id` as the public identifier
   - The route is under `/files` (not `/api/files`) for simpler URLs and better SEO
   - The `/download` suffix is explicit about the action and allows future sibling routes like `/files/[fileId]/preview`

2. **Access control enforcement**:
   - Public files (`visibility: PUBLIC`) are downloadable by anyone
   - Unlisted files (`visibility: UNLISTED`) require a direct link but no authentication
   - Private files (`visibility: PRIVATE`) require authentication and ownership or admin role check

3. **Download audit logging**:
   - Every download through the app route is logged with user ID (if authenticated), file ID, IP address, and timestamp
   - Logged as `Log` entries with action `downloadFile` for consistency with existing logging
   - Direct provider URL access (if exposed) is not logged by the app

4. **Content-Disposition header**:
   - Set `Content-Disposition: attachment; filename="..."` by default to trigger browser downloads
   - Use the original `FileAsset.name` as the suggested filename
   - Future enhancement: add optional `?inline=1` query parameter for preview mode

5. **Provider URL visibility**:
   - Provider URLs (`FileAsset.url`) are NOT exposed in public API responses or client-side code
   - Admin pages MAY show provider URLs for debugging or migration purposes
   - Public pages use app-owned download routes exclusively

6. **Caching and performance**:
   - The download route proxies the file from UploadThing to the client
   - HTTP caching headers are set based on file mutability (immutable files get long cache times)
   - Future enhancement: signed time-limited direct links to reduce server load for large public files

7. **Error handling**:
   - 404 if file not found or deleted (`status != ACTIVE`)
   - 403 if file is private and user lacks access
   - 500 if provider fetch fails, with error logged for admin review

### What changes

**Database**: No schema changes required — existing `FileAsset` table has all needed fields.

**New route handler**: `app/files/[fileId]/download/route.ts`
- Validates file ID format
- Fetches `FileAsset` from database
- Checks access based on `visibility` and session
- Logs download attempt
- Proxies file content from `FileAsset.url` with appropriate headers

**New server action**: `app/_data/files.ts` additions
- `getFileAssetForDownload(fileId: string, userId?: string)`: returns file or throws access error
- `logFileDownload(fileId: string, userId?: string, ipAddress?: string)`: records download event

**Admin file list updates**: `app/admin/files/page.tsx`
- Replace direct provider URL links with app-owned download links
- Show both app URL and provider URL (for debugging)

**Documentation updates**: `openspec/specs/file-sharing-structure/spec.md`
- Archive existing "Public download boundaries" requirement as now implemented
- Document the implemented download route pattern for future file features

### What stays the same

- `FileAsset` table structure (no migration)
- File upload flow through UploadThing
- Quota enforcement and storage tracking
- Legacy `imageUploader` route behavior (not migrated in this slice)

### Out of scope for this feature

- Signed expiring download URLs (future enhancement)
- Range request support for partial downloads (future enhancement)
- Download rate limiting per user or IP (future enhancement)
- Thumbnail or preview generation (future enhancement)
- Bulk download or ZIP packaging (future enhancement)
- CDN integration or edge caching (future enhancement)
- Migration of legacy image URLs to app-owned routes (separate feature)

## Impact

**For users:**
- File download URLs are now stable across provider changes
- Private files are properly access-controlled
- Download behavior is consistent (always triggers download, not inline display)

**For admins:**
- Visibility into who downloads what files
- Ability to revoke access by changing file visibility
- Provider URLs remain accessible for debugging

**For developers:**
- All file rendering code uses app-owned URLs
- Provider coupling is isolated to the download route handler
- Future provider migration only requires updating the proxy logic

## Implementation notes

- Start with synchronous proxy (fetch from provider, stream to client)
- Log download attempts even if they fail (for security audit)
- Test with various file sizes to ensure streaming works correctly
- Consider adding request timeout to prevent hanging connections

## Related

- Depends on: `feature-015-file-sharing-structure` (file foundation)
- Depends on: `feature-017-auth-admin-plugin-role-storage` (role checks)
- Enables: `feature-025-admin-file-manager-polish` (download links in admin UI)
- Enables: Future file attachment features (posts, docs, videos)

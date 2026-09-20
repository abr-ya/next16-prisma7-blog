# Design

## Context

See [proposal.md](./proposal.md). `parseOneImage` correctly converts a timezone-less `DateTimeOriginal` or `CreateDate` into `captureTimeProvenance.localWallTime` with `MISSING` timezone evidence and `capturedAt: null`. `buildSummary`, however, selects its capture image only with `images.find((image) => image.capturedAt)`, discarding that valid provenance. The existing track-time matching path only needs the retained local wall-clock value plus one linked IANA timezone to derive a safe absolute instant.

## Goals / Non-Goals

**Goals:**

- Select the first image with either an absolute capture instant or valid capture-time provenance when building the summary.
- Preserve the existing source precedence: GPS UTC, offset-aware `DateTimeOriginal`, then offset-aware or timezone-less `CreateDate`.
- Retain `MISSING` evidence until the existing single-track assumption or explicit authorized confirmation resolves it.

**Non-Goals:**

- No automatic reparse or bulk rewrite of stored photos.
- No use of `ModifyDate`, file timestamps, process timezone, or browser timezone as a capture-time fallback.
- No data model or migration change.

## Decisions

### Select a summary capture image by provenance as well as absolute instant

Change summary aggregation to choose the first ordered image whose `capturedAt` is non-null **or** whose `captureTimeProvenance` is present. Copy `capturedAt`, timezone evidence, and provenance from that same image. This retains a camera-local value without falsely storing it as UTC.

**Alternative:** write a synthetic UTC timestamp during EXIF parsing. Rejected because a timezone-less EXIF value is ambiguous and existing requirements prohibit invented UTC.

### Repair on authorized refresh, without bulk mutation

The fixed parser applies when a photo receives its normal initial extraction or an authorized `Refresh EXIF metadata`. Existing stored summaries remain unchanged until such a refresh; the fix does not scan or alter user records in bulk.

**Alternative:** data migration or background reparse. Rejected because it would require fetching every original, change persisted metadata broadly, and introduce avoidable operational risk.

## Risks / Trade-offs

- [The chosen local time could be from a later image in a multi-image photo] → preserve existing first-in-image-order selection and display its unconfirmed provenance.
- [A user may mistake camera-local time for UTC] → retain `MISSING` evidence and existing UI wording/confirmation requirements.
- [Older records stay unavailable until refresh] → use the existing owner/admin refresh control; no hidden bulk work occurs.

## Migration Plan

1. Correct the summary selector and add focused fixture coverage for a timezone-less `CreateDate`.
2. Refresh the affected photo through the existing authorized EXIF workflow.
3. Verify display, track-time assumption, and candidate behavior with one confirmed linked-track timezone.
4. Rollback is code-only; no migration or irreversible stored-data operation is involved.

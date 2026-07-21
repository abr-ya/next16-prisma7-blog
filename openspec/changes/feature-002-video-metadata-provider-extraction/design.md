## Context

The video library currently stores the admin-provided title, external URL, optional thumbnail URL, channel, visibility, and video date. YouTube URL parsing already exists for deriving a thumbnail and copying a video ID, but metadata is not persisted on `Video` records and create/edit saves depend only on the manually submitted form fields.

This change turns provider parsing into a server-side enrichment step. The saved URL remains the durable source of truth, while provider metadata gives admin and public video views better thumbnails, embeds, and future search/filter inputs.

## Goals / Non-Goals

**Goals:**

- Persist optional provider metadata on `Video` records.
- Extract metadata automatically during admin create/edit saves.
- Keep unsupported providers and extraction failures non-blocking.
- Keep manual thumbnail values under admin control.
- Keep metadata extraction server-side for save behavior and data integrity.

**Non-Goals:**

- Do not require a provider API key or network call before a video can be saved.
- Do not add broad provider coverage beyond a reusable abstraction and initial YouTube support.
- Do not implement video search, tags, notes, import/export, or bulk actions.
- Do not change owner scoping, authentication, or public/private visibility rules.

## Decisions

1. Add optional metadata columns on `Video`.

   Add nullable fields for `provider`, `providerVideoId`, `embedUrl`, and a future-ready `durationSeconds`. Reuse the existing `thumbnailUrl` column for saved thumbnails rather than adding a second thumbnail field in this slice.

   Rationale: provider, providerVideoId, and embedUrl are stable and useful immediately. `durationSeconds` is nullable so a later API-backed metadata slice can fill it without another schema migration. Keeping all fields nullable preserves existing rows and failure-tolerant saves. Reusing `thumbnailUrl` avoids duplicate thumbnail precedence rules.

   Alternative considered: store provider metadata as JSON. That is more flexible, but it weakens type safety and makes future filtering/search harder.

2. Use a provider extractor abstraction with initial YouTube support.

   Introduce a server-safe metadata helper under `lib/video-providers` that returns a normalized metadata object or an empty result. YouTube extraction derives provider ID, thumbnail URL, and embed URL from known URL shapes without a required external API call. `durationSeconds` remains nullable for this slice.

   Rationale: current code already has YouTube parsing and thumbnail derivation. A small abstraction lets later providers fit the same contract without changing `app/_data/videos.ts` repeatedly.

   Alternative considered: call provider APIs during every save. That would improve duration coverage, but it adds credentials, rate limits, latency, and failure modes that conflict with the core failure-tolerant save rule.

3. Run enrichment during create/edit on the server.

   `createVideo` and `updateVideo` should call the extractor after validating the submitted URL and before writing the record. Extracted metadata is written with the video when available.

   Rationale: server-side extraction keeps persisted data consistent across client forms, table actions, and future import flows. Client-side preview helpers can still exist, but they are not the source of persisted metadata.

   Alternative considered: only extract in the client form. That would miss other save paths and would make metadata easier to drift from server behavior.

4. Preserve manual thumbnail precedence.

   If an admin provides or keeps a custom `thumbnailUrl`, saving the video should not silently overwrite it with a provider thumbnail. If no thumbnail is submitted and the extractor returns a supported thumbnail URL, the save may persist the provider thumbnail.

   Rationale: the existing spec already protects custom thumbnails when URLs change. Provider metadata should not surprise admins by replacing curated thumbnails.

5. Reset stale provider metadata when the URL changes to an unsupported provider.

   If extraction returns no provider metadata for the saved URL, provider fields should be stored as `null` rather than preserving stale metadata from the previous URL.

   Rationale: stale provider IDs or embed URLs are worse than missing metadata because they point to the wrong external video.

## Risks / Trade-offs

- Schema migration touches existing video rows -> nullable fields and no backfill requirement keep migration low-risk.
- Duration remains empty for URL-only YouTube parsing -> UI treats duration as optional and hides it when absent; API-backed duration extraction is a follow-up.
- Provider thumbnail auto-fill could overwrite curated images -> manual thumbnail precedence prevents silent replacement.
- Unsupported providers produce sparse metadata -> saves still succeed and future provider support can fill additional fields later.
- Public embeds can leak private videos if visibility checks drift -> reuse existing public queries that only return `PUBLIC` videos.

## Migration Plan

1. Add nullable `Video` metadata fields and generate a Prisma migration/client update through the normal project flow.
2. Update server-side video data helpers to populate metadata on create/edit and clear stale metadata when unsupported.
3. Update admin/public display components to use metadata only when present.
4. Validate with TypeScript, lint, build, OpenSpec validation, and a manual browser check expectation for supported and unsupported URLs.

Rollback is straightforward because the new fields are nullable and additive: application code can stop reading/writing them without invalidating existing video records.

## Open Questions

- Which future provider source should fill `durationSeconds`: YouTube Data API, another metadata endpoint, or a dedicated refresh workflow.

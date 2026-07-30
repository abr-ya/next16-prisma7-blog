## Context

Public video detail currently renders either an iframe when `embedUrl` exists or the thumbnail fallback when it does not. This hides the preview for embeddable videos and gives visitors no explicit control over preview versus playback.

## Goals / Non-Goals

**Goals:**

- Always render a stable preview area for public video detail pages.
- Let visitors switch between preview and embedded player when `embedUrl` is present.
- Show a disabled player option with a concise reason when `embedUrl` is missing.
- Preserve the external open-video link as the reliable fallback.

**Non-Goals:**

- No provider metadata extraction changes.
- No data model or migration work.
- No persistent user preference for preview/player mode.
- No changes to public video list cards or admin video forms.

## Decisions

1. Move detail media into a client component.

   The current page is a server component, while the preview/player toggle needs local UI state. A dedicated `components/video-pages` client component keeps interactivity small and keeps the server page responsible for data fetching and metadata.

2. Default to preview mode.

   The backlog asks to always show the video preview. Starting in preview mode avoids immediate third-party iframe loading and lets the visitor choose playback intentionally.

3. Keep disabled player mode visible when embedding is unavailable.

   Hiding player mode would make the absence feel like a bug. A disabled toggle with a short reason explains the state while keeping the same UI shape across videos.

4. Reuse `VideoThumbnail` for preview rendering.

   The existing component already handles thumbnail load errors and no-thumbnail fallback. Reusing it keeps behavior consistent and avoids duplicating image fallback logic.

## Risks / Trade-offs

- Preview links open the external video in a new tab -> this preserves current thumbnail behavior and the separate open-video action remains available.
- The embedded iframe is loaded only after switching to player mode -> first playback interaction may take a moment, but the page loads lighter by default.
- Videos without `embedUrl` show a disabled player control -> this is clearer than hiding the control, but the copy must stay short so the media area does not feel noisy.

## Migration Plan

No migration is required. Rollback is removing the new detail media component and restoring the server page's existing iframe-or-thumbnail conditional.

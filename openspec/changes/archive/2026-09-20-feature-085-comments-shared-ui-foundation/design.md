# Design

## Context

See [proposal.md](./proposal.md). The only current public comment consumer is `VideoCommentComposer`. It owns both target-specific concerns (the `videoId`, `createVideoComment` action, router refresh, and count update) and presentational concerns (comment cards, avatar fallback, localized date, safe text rendering, empty state, authentication prompt, and creation form). `lib/comments.ts` already provides the normalized `CommentListItem` contract required for a target-neutral list.

This change is intentionally a UI-only refactor. `Comment` remains video-backed for now; the server actions and their public-video visibility checks remain unchanged.

## Goals / Non-Goals

**Goals:**

- Create shared client UI primitives that render normalized comments consistently for more than one future target.
- Keep target-specific server actions, authorization, revalidation, and mutation error handling in a target wrapper.
- Preserve every observable public-video comment behavior and its current visual hierarchy.
- Allow a later target wrapper to provide its own labels and optional per-item action area without copying the list or composer markup.

**Non-Goals:**

- No Prisma schema, relation, migration, query, or server-action changes.
- No photo, post, or markdown-document comment target.
- No new edit/delete controls or other observable mutation behavior on video comments.
- No unified `/comments` feed, pagination, moderation, or broad component-library abstraction.

## Decisions

### 1. Extract presentation primitives; retain a video target wrapper

Create shared comment UI modules beneath `components/comments` (or the closest established shared-component location). They consume `CommentListItem[]` and explicit display/callback props. Keep a small `VideoCommentComposer` wrapper at the video boundary, which supplies the existing video labels, `createVideoComment` call, submission state, toast behavior, router refresh, and count state.

This preserves the server/client boundary: shared client components never import a target-specific server action or infer target access from a `CommentListItem`.

**Alternatives considered:**

- Make a single generic component import actions based on `target.type`: rejected because it couples UI to every current and future target and risks selecting a mutation without the target's server-side authorization context.
- Keep a copied photo-specific component: rejected because it would duplicate safe text, avatar, empty state, form accessibility, loading, and error behavior before there is a second consumer.

### 2. Use the existing normalized list item as the shared display contract

The extracted list accepts `CommentListItem` values and renders author avatar/fallback, display name, formatted date, and `CommentText`. It does not render `target` metadata in an embedded target page because the target is already implied; the future unified feed may compose a target presentation separately.

**Alternatives considered:**

- Introduce a new UI-only comment record: rejected because it would duplicate the established domain contract and need another adapter.

### 3. Keep mutation ownership at the target boundary

The shared composer accepts an async creation callback plus text, label, placeholder, maximum-length, disabled, and pending-state props. The target wrapper decides what action to call and how to revalidate/refresh after success. The shared item/list exposes an optional action slot or equivalent narrow extension point, but this change passes none for videos; photo own-edit/delete controls are introduced only with the photo-comments feature.

This lets future targets enforce their distinct public visibility and permission checks only on the server, while all UI targets share form interaction behavior.

**Alternatives considered:**

- Move generic server actions into this feature: rejected because the current `Comment` schema is target-specific by explicit relation and the photo target does not exist yet.
- Add video edit/delete UI now to prove the action slot: rejected because it changes public behavior outside this refactor.

### 4. Preserve video accessibility and safe rendering details

The extracted composer retains a programmatically associated label/textarea, character counter, disabled submitting state, submit icon/spinner, sign-in prompt for anonymous users, and current max content length. The list continues to use `CommentText`, rather than interpreting comment HTML or URLs in a new component.

## Risks / Trade-offs

- [An overly generic component could obscure a target's permission rules] → Keep actions and target identifiers out of the shared primitive; server actions remain target-specific.
- [A visual regression on video comments] → Preserve the existing wrapper route and class hierarchy where practical; manually compare authenticated and anonymous video views after the refactor.
- [Future feed requirements may not match embedded-list requirements] → Do not render target metadata in the base embedded list; the feed can compose it around the same normalized item data.
- [Action-slot API may be unused until photo comments] → Keep it narrow and optional; do not add edit/delete state machinery until a consumer exists.

## Migration Plan

1. Add shared UI primitives alongside the existing component.
2. Refactor the video wrapper to delegate rendering and creation-form presentation to the primitives while retaining its current action and refresh flow.
3. Run static checks and manually verify public video comment states for anonymous and authenticated sessions.
4. Deploy as a behavior-preserving frontend refactor. Roll back by restoring the previous video-local component implementation; no data migration or persisted state is involved.

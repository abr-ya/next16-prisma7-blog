# Design

## Context

See `proposal.md` for the motivation. The change is small in code and deliberate in meaning, so the decisions are mostly about what "published" means for this path and what stays untouched.

The pieces this change sits on:

- **`createQuickWorkout`** (`app/_data/tracks.ts`) — the one-click save. It runs the checks in the order of the refusals (trust gate, quota, title, activity type, file, gear, slug, parse) and writes the track inside `createWithinVerifiedResourceQuota`.
- **`DEFAULT_TRACK_STATUS`** (`app/_data/tracks.ts:194`) — the `DRAFT` default every other creation path uses. `createTrack` and `createManualTrack` fall back to it; the quick upload names its status explicitly.
- **The public read path** — `getPublicTracks` (`app/_data/tracks.ts:749`) lists the tracks whose status is `PUBLISHED`, and `getPublicTrackBySlug` (`app/_data/tracks.ts:760`) resolves a published track by its slug. A draft resolves to `null`, and the page answers `notFound()`.
- **`toPublicTrack`** (`app/_data/tracks.ts:512`) — the public projection. It computes the download availability from the *file asset's* visibility, not from the track's status.
- **`revalidateTrackPaths`** (`app/_data/tracks.ts:615`) — revalidates `/admin/tracks`, `/my/tracks`, `/admin/files`, `/tracks`, and `/hikes` after a write.

Two constraints shape the work:

1. **The trust gate and the quota run before the row is written**, and they do not look at the status. Publishing changes what the row means, not who may create it.
2. **The GPX file is created private** by the shared upload route (`app/api/uploadthing/core.ts:161`). The `outdoor-tracks` capability owns the rule that follows from it — "Public track GPX downloads respect file visibility": a published track whose file is `PRIVATE` shows the download as unavailable, with no link and no provider URL.

## Goals / Non-Goals

**Goals:**

- A quick upload ends with a published workout: it is among the published tracks and its public page works.
- Every refusal, gate, and quota of the quick upload keeps behaving exactly as before.
- The other creation paths keep their own draft default — the change stays scoped to the one-click path.

**Non-Goals:**

- A status control in the quick upload dialog, or a status column or a per-row toggle in the track tables. That is the open question of the tracks-page analysis, filed as a candidate in `openspec/research-backlog.md`.
- Any change to the file-visibility rules, the trust gate, the quotas, the parse, or the wording.
- Any change to how a published track looks beyond the status.

## Decisions

### 1. The quick upload names the published status; the shared default stays `DRAFT`

**Decision:** `createQuickWorkout` writes `status: "PUBLISHED"`. `DEFAULT_TRACK_STATUS` stays `DRAFT` for `createTrack` and `createManualTrack`.

**Why the default is not changed globally:** the request is about the one-click path — the path where the owner has already decided what the recording is. The full form is a different surface: it exists to prepare a track, and its draft default is what lets a track be assembled in pieces before it goes out. Flipping the shared default would publish every manually created track too, which is a much wider behavior change than the one that was asked for.

**Why the status is named explicitly rather than left to a default:** the quick upload already names every other derived value explicitly — the activity type, the kind, the slug, the recording timezone. Writing the status in the same place keeps the whole derivation in one readable block, and it makes the difference between this path and the others visible at the point of the write.

### 2. No status control in the dialog

**Decision:** the dialog collects the same three things — a file, a title, and the shoes. There is no "save as draft" checkbox.

**Why:** the owner asked for the default to be published, and the escape hatch is one click away in the track form, where the status field already is. A second control in the dialog is a design question of its own — what it looks like, what it defaults to, whether it is per activity type — and that question is what the tracks-page analysis is about. Shipping the default now and the control after the analysis keeps one decision per change.

### 3. Publishing the track does not publish the file

**Decision:** the published status concerns the track. The GPX file keeps the private visibility the upload route gave it, and the public page shows the download as unavailable.

**Why:** the two are separate switches in this system, and the file's visibility is the owner's decision in the file manager. The quick upload path never published the file either — it simply did not publish the track. What changes here is that the track becomes public while the file stays private, which the existing file-visibility rule already describes for any published track with a private file.

**Consequence:** the public page of a quick-uploaded walk shows the title, the map, the distance, the duration, and the recording time — and no download link. Making the file downloadable stays a separate action on the file.

### 4. A file that cannot be parsed still creates a published track

**Decision:** the parse failure path is untouched. The track is created, published, and its public page renders the unparsed fallback — the metadata without a map.

**Why:** the status is the owner's decision, and the parse is the file's property. Tying the two — "publish only when the parse succeeded" — would make the status depend on the parse outcome, so the same click would sometimes publish and sometimes not, with no control over which. The owner can unpublish from the track form.

**Trade-off, recorded:** a walk whose file did not parse becomes a public page with a title and no map. This is the sharpest edge of the new default, and it is the reason the status control is worth designing.

### 5. The refusals, the gate, and the quota are unchanged

**Decision:** the order of the checks stays as it is, and every check still refuses the same inputs for the same reasons.

**Why:** the trust gate and the verified quota answer "may this account create a track at all", and they are answered before the row exists. Publishing changes the fate of the row that passes them, never who is allowed to try.

### 6. No revalidation change is needed

**Decision:** nothing in the revalidation path changes.

**Why:** `revalidateTrackPaths` already revalidates `/tracks`, which is where a published track newly appears. The public detail page reads by slug on each request, so it sees the new status without a targeted revalidation.

## Risks

- **A mistake becomes public.** A wrong title, a wrong activity type, or a duplicate upload now reaches the public site at once. The owner's answer is the unpublish in the track form and, later, the status control the analysis has to shape.
- **The auto-generated title becomes a public title.** The suggestion comes from the file's recording start; it is editable in the dialog, and it stays the same wording it was.
- **The unparsed fallback** — see decision 4.

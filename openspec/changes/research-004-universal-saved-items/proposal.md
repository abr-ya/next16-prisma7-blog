# Research Proposal

## Why

The owner wants a **quick save**: paste a link, get a saved record with a title and a URL (both required), an optional note, an optional small image, plus a creation date, an update date, and an owner. The first framing of this idea was video-only — a `video-candidate-inbox` candidate in [`openspec/research-backlog.md`](../../research-backlog.md), raised to P0 on 2026-11-25.

The owner has since reframed it: the carrier should be **general**, not video-specific. The argument is that the quick-save record and its form can be built once and then extended per content type — a saved video link grows a video-shaped detail form, a saved article grows an article-shaped one — without reworking the capture path each time. On the minimal version the record is four parameters (title, URL, note, image) plus timestamps and an owner.

The repository already holds two near-misses that make the question concrete rather than hypothetical:

- `Link` ([`prisma/schema.prisma`](../../../prisma/schema.prisma)) is a **user-level link registry** with a public `shortCode` and a join table `LinksToPosts` — but it is a publication concept (addressable publicly), it is admin-only today, and it carries no note, image, or lifecycle.
- `VideoBookmark` is **not** a saved-link concept at all: it is a timestamp marker inside one video (`videoId`, `timestampSeconds`, `label`, `note`). The word "bookmark" therefore already means something else in this schema, and reusing it for a general quick save would collide.

So the question is not "should we add a table" but "what is the general carrier, what is its boundary against the two existing link-ish models, and what does it cost to add the next type later".

## Research Question

What should the general quick-save carrier be, where should it live, and how does a saved item eventually become published content?

Concretely:

1. **Carrier shape.** One generic table with a nullable `type` column plus a `typeMeta` payload, versus a per-type table (`VideoCandidate`), versus a generic table plus a subtype table (`SavedItem` + `SavedItemVideo`). The owner has already decided that the type discriminator exists from v1 with video as its first value; the investigation must validate that decision, specify it (nullable `type` with a default value? `typeMeta` JSON or subtype rows? what happens to a plain saved link with no type?), and state what adding the second type costs under each option.
2. **Boundary with the existing models.** Should a saved item be a kind of `Link`, a separate thing beside it, or a private draft that later *promotes* into a `Link`? The same question for `Video`: does promotion create a `Video` row, or a `Video` plus its provider metadata, and who owns it? And what is the honest difference between the quick save and the existing admin link form?
3. **The optional image.** `FileAsset` already is an owner-scoped asset record with `visibility`, `status`, `purpose`, and `uploadedAt`/`updatedAt`/`deletedAt`. Is a plain reference to a `FileAsset` enough for the "small image" of a saved item, or does it drag in the photo-library work (the `outdoor-photo-albums-structure` candidate)? What thumbnail rule applies, and does reusing `Photo`/`PhotoImage` (which are published-content entities with likes, comments, and a `DRAFT`/`PUBLISHED` status) cost more than it saves?
4. **Minimal form versus detailed form.** The owner describes a minimal record and a richer, per-type form. Which fields belong in the carrier so they survive every type (title, URL, note, image, owner, timestamps), and which belong to a type-specific extension? The extension mechanism is the part that decides whether the next type is free.
5. **Metadata fetching.** YouTube URL canonicalization (`watch`, `youtu.be`, `shorts`, `embed`, `live`), oEmbed retrieval with a strict provider allowlist (an arbitrary URL fetch is an SSRF hole), and whether fetching happens on save, on demand, or in the background. Should v1 store the URL exactly as typed and fetch nothing?
6. **Identity and dedupe.** Dedupe by `(userId, normalized URL)`, by `(userId, provider, providerVideoId)`, or globally? What happens on a duplicate — update in place, keep both, or refuse — and which wins when the titles differ?
7. **Publication, rights, and moderation.** A personal quick save is private by default. But the candidate also asked whether a saved item may reach the public `/videos` feed, whether that requires a trusted role, and how it interacts with the existing `VideoVisibility` split and with the account-trust work. Where does the moderation boundary sit for a personal capture that later becomes public?
8. **Page placement.** The personal area is `/my/*` (`tracks`, `gear`, `routes`, `places`, `workouts`, `source-aliases`), and those pages reuse the admin panels in `components/admin-pages`. Should the quick save live at `/my/saved`, and does the admin-panel-reuse convention hold for it?
9. **Folders and bulk behavior.** Flat versus nested folders, a virtual "Inbox", counts, and bulk actions once the list grows.
10. **The promotion path.** For each existing target — `Video`, `Post`, `Link` — what exactly must be copied, re-pointed, or re-fetched when a saved item is promoted, and which fields cannot be derived?

## Scope

- The carrier model: its fields, its type discriminator, its ownership, its visibility, and its lifecycle.
- Its relationship to `Link`, `LinksToPosts`, `VideoBookmark`, `Video`, `Post`, `PostImage`, `Photo`, `PhotoImage`, and `FileAsset`.
- The quick-save form (minimal and detailed) and the personal page that would host it.
- Dedupe and identity rules, and the metadata-fetching boundary.
- The path from a saved item to published content, and the moderation/trust boundary around it.
- The explicit boundary against the media-library candidate: what the saved item needs from media today, and what stays deferred.

## Non-Goals

- Implementing anything. This change produces an investigation output, not code.
- Designing the photo library or the album model. That stays in [`openspec/backlog.md`](../../backlog.md) as `outdoor-photo-albums-structure`.
- Deciding the final field-by-field schema of any future public publication flow; the investigation only names the constraints that flow inherits.
- Redesigning the public `/videos` feed or the public links surface.
- Deciding the moderation policy of the account-trust work, beyond stating where a quick save would meet it.

## Capabilities

None — investigation only. `skip_specs: true` is set in the change.

## Impact

- [`openspec/research-backlog.md`](../../research-backlog.md): the promoted candidate row.
- [`openspec/backlog.md`](../../backlog.md): the media-library candidate row, updated with the deferral boundary found here.
- This change's `output.md`.

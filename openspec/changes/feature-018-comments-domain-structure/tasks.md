## 1. Current Comment Inventory

- [ ] 1.1 Document the current Prisma `Comment` model and its video-only relation.
- [ ] 1.2 Document the current video comment data helpers and UI components.
- [ ] 1.3 Document the current `/comments` placeholder behavior.

## 2. Domain Decisions

- [ ] 2.1 Decide that `/comments` is a unified comments feed with `All` and `Mine` views, not a standalone guestbook.
- [ ] 2.2 Decide that comments use explicit target relations and must belong to exactly one target.
- [ ] 2.3 Define the near-term supported targets as videos and posts, with docs comments deferred.
- [ ] 2.4 Defer replies and threaded discussions to a later feature.
- [ ] 2.5 Define ownership and moderation boundaries for ordinary users, admins, and a future editor role.

## 3. Shared Contract and Follow-up Slicing

- [ ] 3.1 Define the normalized reusable comment list item contract.
- [ ] 3.2 Define target adapter responsibilities for target title, href, and optional preview data.
- [ ] 3.3 Define a follow-up schema/helper foundation slice.
- [ ] 3.4 Define a follow-up `/comments` unified feed implementation slice.
- [ ] 3.5 Define a follow-up reusable comment UI extraction slice.
- [ ] 3.6 Link existing comment follow-ups for link handling, own edit/delete controls, and edit/delete expiry.

## 4. Validation and Closeout

- [ ] 4.1 Run `openspec validate feature-018-comments-domain-structure --strict`.
- [ ] 4.2 Run `openspec status --change feature-018-comments-domain-structure`.
- [ ] 4.3 Run `git diff --check`.

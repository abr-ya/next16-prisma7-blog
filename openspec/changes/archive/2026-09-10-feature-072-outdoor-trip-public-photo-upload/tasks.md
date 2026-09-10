## 1. Contribution authorization and quota

- [x] 1.1 Add narrow trip-detail capability data for creator, accepted participant, and administrator photo contribution eligibility, keeping it out of anonymous public reads.
- [x] 1.2 Add a server-authoritative trip photo contribution action that reloads the session, validates published-trip access and accepted membership, validates title/description and existing photo file-asset eligibility, and revalidates affected paths on success.
- [x] 1.3 Create the owned published photo, ordered image bindings, and next trip-photo association atomically using the existing photo model.
- [x] 1.4 Enforce the 10-photo-per-non-admin-user-per-trip limit inside the write path so concurrent requests cannot exceed it; retain administrator override and return a clear limit-reached error without partial records.

## 2. Shared photo dialog and public trip contribution UI

- [x] 2.1 Extract the administrator photo dialog's shared title, description, image-selection, and upload controls into a reusable component, retaining administrator-only fields and mutations solely in the administrator mode.
- [x] 2.2 Replace the inline trip contribution form with an eligible-user `Add photo` trigger that opens the shared dialog in contribution mode; reuse the existing outdoor-photo upload endpoint and enforce the current one-to-three-image client constraints.
- [x] 2.3 Preserve pending, success, validation, authorization, and quota-reached feedback in the dialog flow, without exposing contribution-management or administrator controls publicly.
- [x] 2.4 Confirm a successful contribution uploads and appears through the existing trip gallery. Remaining manual authorization and public-dialog checks are deferred from this feature checklist.

## 3. Documentation and validation

- [x] 3.1 Keep `openspec/backlog.md` aligned: feature-072 remains In Progress and `outdoor-trip-photo-contribution-quota-tiers` remains the unnumbered follow-up for reputation-based limit expansion.
- [x] 3.2 Run `openspec validate feature-072-outdoor-trip-public-photo-upload --strict`.
- [x] 3.3 Run `npm run tsc` and targeted ESLint for changed non-`app` TypeScript/TSX files; run `npm run lint` for changed `app` files.
- [x] 3.4 Local `npm run build` passed on 2026-09-10; successful photo upload and gallery visibility were manually confirmed. Remaining manual authorization, quota, and public-dialog checks are deferred from this feature checklist.

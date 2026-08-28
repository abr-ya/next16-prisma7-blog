## 1. Discovery

- [x] 1.1 Review current legacy migration helpers, post form tag behavior, admin panel wiring, and public display fallback before editing implementation.

## 2. Selected Planning Data

- [x] 2.1 Extend legacy migration planning data so eligible post rows include post identity, raw legacy values, planned normalized tags, skipped values, and selected dry-run summary inputs.

## 3. Selected Dry-Run Server Path

- [x] 3.1 Add selected-post dry-run behavior that rejects empty selections, re-checks eligibility, summarizes only selected eligible posts, and preserves the existing raw-value inventory summary.

## 4. Admin Selection UI

- [x] 4.1 Update the `Legacy Post Tags` panel with selectable eligible posts, selected count feedback, clear/select-all-visible controls, disabled empty states, and post-scoped planning only.

## 5. Dry-Run UX

- [x] 5.1 Wire `Dry Run Selected` to the selected summary and show success/error feedback while keeping existing broad import behavior visually distinct until the follow-up replaces it.

## 6. Boundaries

- [x] 6.1 Preserve `/admin/content-tags` page composition, public tag display fallback behavior, legacy `Post.tags` values, and defer selected import/apply to `feature-046-content-tags-selected-legacy-post-import-apply`.

## 7. Validation

- [x] 7.1 Run OpenSpec, TypeScript, lint, targeted ESLint for changed non-`app` files, request local `npm run build`, and manually verify the selected dry-run workflow on `/admin/content-tags`.

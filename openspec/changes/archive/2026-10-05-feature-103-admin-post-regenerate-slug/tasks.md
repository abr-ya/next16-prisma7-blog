# Tasks

## 1. Admin form behavior

- [x] 1.1 Add an explicit `Regenerate slug` control next to the shared post-form slug input that derives a non-empty replacement from the current title and updates the field as dirty and validated; verify it works on both `/admin/posts/new` and `/admin/posts/[id]`.
- [x] 1.2 Preserve direct slug entry and the existing empty-slug title-blur behavior; verify a title edit does not replace an already populated slug unless the administrator activates regeneration.

## 2. Safeguards and verification

- [x] 2.1 Preserve current save behavior for invalid or duplicate regenerated values; verify regeneration itself performs no save and a conflicting submitted slug follows the existing uniqueness error path.
- [x] 2.2 Run `npm run tsc` and targeted ESLint for `components/admin-pages/post-form.tsx`; verify both pass.
- [x] 2.3 Ask for or perform local browser validation with an administrator on create and edit forms, including a manually changed slug, title change without regeneration, explicit regeneration, and form submission. Verified successfully by the user on 2026-10-05.
- [x] 2.4 Run `npm run build` locally and record the result in this change's implementation notes/checklist before completion. Passed locally on 2026-10-05; Next.js emitted non-fatal `Couldn't load fs` / `Couldn't load zlib` notices while collecting page data.

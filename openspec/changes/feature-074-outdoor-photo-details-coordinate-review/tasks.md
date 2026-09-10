## 1. Authorized photo-detail data and review boundaries

- [x] 1.1 Add a narrow server-side per-trip photo-detail projection that returns capture summary, accepted coordinate provenance, and capability flags only for the photo owner, trip creator, accepted active participant, or administrator.
- [x] 1.2 Add server-authoritative coordinate-review actions for the photo owner, trip creator, and administrator that revalidate session, published trip/photo linkage, candidate data, and manual-coordinate input before reusing the existing approval/rejection persistence rules.
- [x] 1.3 Keep anonymous and unrelated signed-in page/action paths image-only and denied respectively; do not project EXIF, exact coordinates, review candidates, or internal extraction errors.

## 2. Shared details and trip gallery UI

- [ ] 2.1 Extract reusable read-only photo metadata and coordinate-provenance presentation from the existing administrator EXIF and trip coordinate-review surfaces, without exposing administrator-only controls in viewer mode.
- [ ] 2.2 Extend the trip gallery viewer so an authorized viewer can open photo details from a card or large-photo view, inspect available EXIF summary and accepted coordinate state, and retain current image navigation behavior.
- [ ] 2.3 Add the authorized owner/creator/admin coordinate-review mode with existing candidate explanations, approval, rejection, manual override validation, pending states, and clear unavailable-state feedback.
- [ ] 2.4 Connect an accepted coordinate from photo details to a focus action on the existing trip map; omit the action when the map or eligible coordinate is unavailable.

## 3. Verification and documentation

- [ ] 3.1 Keep `openspec/backlog.md` and any affected outdoor-photo/trip documentation aligned with the accepted authorization and privacy policy.
- [ ] 3.2 Add focused deterministic coverage or checks for authorized detail projection, unauthorized metadata denial, direct-EXIF versus approved-inferred provenance, and direct coordinate-review action denial.
- [ ] 3.3 Run `openspec validate feature-074-outdoor-photo-details-coordinate-review --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [ ] 3.4 Ask the user to run `npm run build` locally and manually verify participant details, owner/creator/admin review, unrelated-user metadata denial, anonymous image-only behavior, candidate approval/rejection, manual correction, and map focus.

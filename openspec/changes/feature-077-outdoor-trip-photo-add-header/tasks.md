## 1. Photos-section composition

- [ ] 1.1 Reshape the existing trip photo-contribution client control for use as a compact Photos-header action while preserving its upload dialog, quota state, success refresh, and error feedback.
- [ ] 1.2 Pass the existing server-authoritative contribution capability into the trip media/gallery composition and render one Photos section when photos exist or contribution is available.
- [ ] 1.3 Render the authorized action beside the Photos heading, remove the page-bottom contribution panel, and keep the gallery grid behavior unchanged when photos are present.

## 2. Validation

- [ ] 2.1 Run `npm run tsc` and targeted ESLint for every changed component/route file.
- [ ] 2.2 Manually verify `/trips/[slug]` as an eligible contributor with photos, an eligible contributor without photos, and a quota-reached contributor; confirm the action is in the Photos header, opens the existing dialog, and no bottom panel remains.
- [ ] 2.3 Run `npm run build` locally and record the result before completing the user-facing change.

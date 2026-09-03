## 1. Navigation Labels

- [x] 1.1 Add a Trips item to the shared public navbar item list, pointing to the existing `/hikes` route.
- [x] 1.2 Add English and Russian navigation locale strings for the Trips label.
- [x] 1.3 Preserve existing navbar links, language switcher, search placeholder, back control, and auth-aware account/login behavior.

## 2. Home Page Link

- [x] 2.1 Add a Trips content-section card to the public home page, pointing to the existing `/hikes` route.
- [x] 2.2 Keep the home page section order aligned with the accepted spec: Blog, Video Links, Markdown Documents, Trips, Comments.
- [x] 2.3 Use public-facing Trips wording while leaving underlying hike route/model/action terminology unchanged.

## 3. Documentation And Validation

- [x] 3.1 Update backlog notes for separate trip category/type management if needed.
- [x] 3.2 Run `openspec validate feature-056-public-trips-navigation-labels --strict`.
- [x] 3.3 Run `npm run tsc`.
- [x] 3.4 Run `npm run lint`.
- [x] 3.5 Ask the user to manually check `/` and a shared-top-nav route in the browser.

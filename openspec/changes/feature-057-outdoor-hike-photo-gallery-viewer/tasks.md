## 1. Thumbnail Access

- [ ] 1.1 Add the image processing dependency needed for deterministic thumbnail-sized responses.
- [ ] 1.2 Add an app-owned thumbnail route for outdoor photo image assets that returns bounded, metadata-stripped image bytes.
- [ ] 1.3 Ensure the thumbnail route only serves active outdoor photo images linked to published photos on published hikes.
- [ ] 1.4 Implement thumbnails as on-demand generated responses with cache headers, without storing persistent derivatives in this slice.
- [ ] 1.5 Keep provider URLs and original file URLs out of guest-visible public hike data.

## 2. Full Photo Access

- [ ] 2.1 Update full file download access so outdoor photo originals exposed through hike associations require an authenticated user.
- [ ] 2.2 Preserve existing visibility behavior for non-photo file downloads and authenticated admin previews.
- [ ] 2.3 Ensure anonymous direct requests for full linked hike photo assets return an authentication-required response without image bytes.
- [ ] 2.4 Preserve the existing safe logging behavior for anonymous image requests.

## 3. Public Hike UI

- [ ] 3.1 Update public hike photo cards to use the thumbnail route instead of the full download route.
- [ ] 3.2 Add an authenticated large-photo viewer for linked hike photos with open, close, next, and previous controls.
- [ ] 3.3 Hide or disable large-photo viewer controls for anonymous visitors while keeping thumbnail cards usable.
- [ ] 3.4 Keep photo ordering aligned with the stored hike-photo association order.
- [ ] 3.5 Keep public hike pages usable when no linked public photos or no eligible thumbnail images exist.

## 4. Documentation And Validation

- [ ] 4.1 Update backlog notes or implementation docs that mention hike photo public exposure and the future persistent-thumbnail derivative decision.
- [ ] 4.2 Run `openspec validate feature-057-outdoor-hike-photo-gallery-viewer --strict`.
- [ ] 4.3 Run `npm run tsc`.
- [ ] 4.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 4.5 Ask the user to run `npm run build` locally and confirm the result before considering routing/media behavior complete.
- [ ] 4.6 Manually check `/hikes/[slug]` as anonymous and signed-in users, including direct thumbnail and full image URLs.

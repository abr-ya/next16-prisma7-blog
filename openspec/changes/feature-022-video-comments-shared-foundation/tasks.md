## 1. Shared Comment Contract

- [ ] 1.1 Add a shared TypeScript comment list item contract with comment, author, and target fields.
- [ ] 1.2 Represent `createdAt` as a serialized string for client component consumption.
- [ ] 1.3 Keep the shared contract independent of video-only UI labels and component state.

## 2. Video Comment Adapter

- [ ] 2.1 Extend the public video comment read shape to include minimal public video target metadata needed by the shared contract.
- [ ] 2.2 Add a video comment normalizer/adapter that maps existing video comments to shared comment list items.
- [ ] 2.3 Preserve ascending `createdAt` ordering and public-video visibility filtering.
- [ ] 2.4 Preserve create/update/delete mutation behavior and revalidation paths.

## 3. Public Video Detail Integration

- [ ] 3.1 Update `/videos/{id}` data mapping to pass shared comment list items into the comment UI.
- [ ] 3.2 Update `VideoCommentComposer` props to consume the shared item shape.
- [ ] 3.3 Preserve the existing visible comment count, list rendering, empty state, sign-in prompt, creation form, and safe link rendering behavior.
- [ ] 3.4 Do not render target metadata on the video detail comment list.

## 4. OpenSpec And Backlog

- [ ] 4.1 Update accepted specs during archive after implementation is complete.
- [ ] 4.2 Move `feature-022` to `Done` in `openspec/backlog.md` only during archive.

## 5. Validation

- [ ] 5.1 Run `openspec validate feature-022-video-comments-shared-foundation --strict`.
- [ ] 5.2 Run `npm run tsc`.
- [ ] 5.3 Run targeted ESLint for changed files outside root lint coverage.
- [ ] 5.4 Run `npm run lint`.
- [ ] 5.5 Perform a browser check on a public video with comments, a public video without comments, anonymous comment access, and authenticated comment creation.
- [ ] 5.6 Run `git diff --check`.

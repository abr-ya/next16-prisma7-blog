## 1. Shared Content Width

- [ ] 1.1 Add a small shared helper for the named narrow (`max-w-3xl`) and wide (`max-w-5xl`) content-width classes.
- [ ] 1.2 Add a `PageLayout` `contentWidth` prop that defaults to narrow and applies the shared wide class when requested.
- [ ] 1.3 Leave existing `PageLayout` callers on the default narrow shell.

## 2. Public Hike Detail Layout

- [ ] 2.1 Switch `/hikes/[slug]` to the wide `PageLayout` content shell.
- [ ] 2.2 Keep type/date badges and description on the shared narrow measure inside that shell.
- [ ] 2.3 Let the route map, linked-track list, and photo gallery span the wide shell.
- [ ] 2.4 Remove the redundant inner article `max-w-3xl` and extra inner horizontal padding that currently shrinks the map.
- [ ] 2.5 Do not change `/hikes` listing, `/tracks/[slug]`, docs, or other public page widths in this slice.

## 3. Tracking And Validation

- [ ] 3.1 Confirm `openspec/backlog.md` marks `feature-065-outdoor-hike-detail-wider-content-container` as In Progress in the outdoor roadmap and P0 Now tables.
- [ ] 3.2 Run `openspec validate feature-065-outdoor-hike-detail-wider-content-container --strict`.
- [ ] 3.3 Run `npm run tsc`.
- [ ] 3.4 Run `npm run lint` plus targeted ESLint for changed files outside `app/` if needed.
- [ ] 3.5 Ask the user to run `npm run build` locally and confirm the result.
- [ ] 3.6 Manually check `/hikes/[slug]` on desktop and a narrow viewport for a hike with map + gallery and a hike with neither, confirming the map/gallery are wider while title/description stay readable.

## 1. Shared Content Width

- [x] 1.1 Add a small shared helper for the named narrow (`max-w-3xl`) and wide (`max-w-7xl`) content-width classes.
- [x] 1.2 Add a `PageLayout` `contentWidth` prop that defaults to narrow and applies the shared wide class when requested.
- [x] 1.3 Leave non-hike `PageLayout` callers on the default narrow shell.

## 2. Public Hike Layout

- [x] 2.1 Switch `/hikes/[slug]` to the wide `PageLayout` content shell.
- [x] 2.2 Keep type/date badges and description on the shared narrow measure inside that shell.
- [x] 2.3 Let the route map, linked-track list, and photo gallery span the wide shell.
- [x] 2.4 Remove the redundant inner article `max-w-3xl` and extra inner horizontal padding that currently shrinks the map.
- [x] 2.5 Switch `/hikes` to the same wide `PageLayout` content shell and drop the dead inner `max-w-5xl` wrapper.
- [x] 2.6 Show hike photo tiles and linked-track cards in up to three columns on medium-and-up viewports, stacking to one column on narrow viewports.
- [x] 2.7 Show public hike listing cards in up to three columns on medium-and-up viewports, stacking to one column on narrow viewports.

## 3. Tracking And Validation

- [x] 3.1 Confirm `openspec/backlog.md` marks `feature-065-outdoor-hike-detail-wider-content-container` as In Progress in the outdoor roadmap and P0 Now tables.
- [x] 3.2 Run `openspec validate feature-065-outdoor-hike-detail-wider-content-container --strict`.
- [x] 3.3 Run `npm run tsc`.
- [x] 3.4 Run `npm run lint` plus targeted ESLint for changed files outside `app/` if needed.
- [x] 3.5 Ask the user to run `npm run build` locally and confirm the result.
- [x] 3.6 Manually check `/hikes` and `/hikes/[slug]` on desktop and a narrow viewport, confirming the listing uses the wide shell with three card columns, detail map/gallery/track cards match that width and grid, and title/description stay readable.

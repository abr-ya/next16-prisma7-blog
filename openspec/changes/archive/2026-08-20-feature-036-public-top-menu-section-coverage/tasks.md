## 1. Planning State

- [x] 1.1 Mark `public-top-menu-section-coverage` as `In Progress` in `openspec/backlog.md` with the assigned `feature-036` change name.

## 2. Navbar Implementation

- [x] 2.1 Inspect current shared public navbar usage to confirm the component covers the expected public pages.
- [x] 2.2 Add Home, Blog, Docs, Videos, and Comments links to the shared public navbar using hydration-safe `NavigationMenuItem` structure.
- [x] 2.3 Preserve the existing back navigation, search placeholder access, anonymous login entry point, and signed-in account menu.
- [x] 2.4 Check responsive wrapping and spacing for the expanded menu.

## 3. Validation

- [x] 3.1 Run targeted lint for the changed navbar files.
- [x] 3.2 Run `npm run tsc`.
- [x] 3.3 Manually inspect the public navbar on representative public pages as an anonymous visitor and signed-in user where feasible.
- [x] 3.4 Ask the user to run `npm run build` locally if route-level validation is needed after implementation.

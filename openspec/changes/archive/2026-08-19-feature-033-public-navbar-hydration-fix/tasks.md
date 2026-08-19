## 1. Navbar Markup

- [x] 1.1 Inspect the shared public navbar and confirm which `NavigationMenuList` child causes invalid list structure.
- [x] 1.2 Update `components/blog-pages/navbar.tsx` so each direct navigation menu list child is structurally valid while preserving current visible controls.
- [x] 1.3 Check whether the authenticated user menu contributes any nearby navigation-menu markup warning and make only minimal related fixes if needed.

## 2. Validation

- [x] 2.1 Run `npm run tsc`.
- [x] 2.2 Run targeted ESLint for changed non-`app` files, such as `npx eslint components/blog-pages/navbar.tsx --quiet`.
- [x] 2.3 Manually open public blog and video pages in the browser and confirm the navbar renders without hydration warnings in the console.
- [x] 2.4 Ask the user to run `npm run build` locally if the implementation changes routing or reveals build-only behavior.

## 3. OpenSpec Tracking

- [x] 3.1 Mark completed implementation and validation tasks in this checklist.
- [x] 3.2 Keep the backlog entry aligned with this promoted feature.

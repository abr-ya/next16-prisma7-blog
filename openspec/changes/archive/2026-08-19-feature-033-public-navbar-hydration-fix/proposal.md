## Why

Public pages should render the shared navbar without React hydration warnings or invalid list markup. The current public navbar can emit a hydration warning because the navigation menu list includes a direct text node alongside Radix navigation menu items.

## What Changes

- Adjust the public navbar markup so each direct child of `NavigationMenuList` is a valid navigation menu item.
- Preserve the existing public navigation links, back action, search placeholder surface, and authenticated user menu.
- Keep the change scoped to the public navbar structure and any minimal styling needed to avoid visual regression.

## Non-goals

- Do not redesign the public navbar.
- Do not implement the search modal placeholder.
- Do not change authentication, role checks, or admin navigation behavior.
- Do not add new routes, data models, or dependencies.

## Capabilities

### New Capabilities

- `public-navigation`: Covers rendering and interaction expectations for the shared public navbar used by public content layouts.

### Modified Capabilities

- None.

## Impact

- Affected routes: public layouts that render the shared navbar, currently `/blog/*` and `/videos/*`.
- Affected code: `components/blog-pages/navbar.tsx` and, only if needed, nearby navbar/user menu components.
- Public surface: visible navbar structure should remain functionally equivalent while removing hydration warnings.
- Admin surface: none.
- Data models, APIs, and dependencies: none.

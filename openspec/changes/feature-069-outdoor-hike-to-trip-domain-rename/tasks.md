## 1. Domain and data migration

- [ ] 1.1 Inventory Hike, HikesTo*, hike-note, route, and public-link dependencies.
- [ ] 1.2 Rename Prisma and application domain types to Trip using storage mappings that preserve records and associations.
- [ ] 1.3 Create and review a data-preserving migration; regenerate the Prisma client.

## 2. Routes and interfaces

- [ ] 2.1 Move primary routes to `/trips` and `/admin/trips`; add permanent legacy redirects.
- [ ] 2.2 Rename data helpers, components, navigation, copy, metadata, revalidation, and internal links to Trip terminology.
- [ ] 2.3 Preserve types, maps, photos, notes, authorization, slugs, and visibility rules.

## 3. Validation and documentation

- [ ] 3.1 Update affected specs and documentation to Trip terminology and compatibility redirects.
- [ ] 3.2 Run strict OpenSpec validation, `npm run tsc`, and targeted ESLint.
- [ ] 3.3 Ask the user to run `npm run build` and verify canonical routes, redirects, admin access, linked media/notes, and visibility.

## 1. Route compatibility foundation

- [x] 1.1 Inventory public/admin hike routes, internal links, metadata, and revalidation paths.
- [x] 1.2 Add `/trips` and `/admin/trips` as canonical route implementations using the existing Hike data API.
- [x] 1.3 Permanently redirect legacy `/hikes`, `/hikes/[slug]`, and `/admin/hikes` routes to their canonical trip equivalents.

## 2. Routes and interfaces

- [x] 2.1 Update navigation, internal links, metadata, revalidation, and visible copy to use canonical Trip terminology and URLs.
- [x] 2.2 Preserve existing Hike Prisma models/data helpers, types, maps, photos, notes, authorization, slugs, and visibility rules.
- [x] 2.3 Record the deferred internal Hike-to-Trip API and Prisma-storage rename as a separate backlog candidate.

## 3. Validation and documentation

- [x] 3.1 Update affected specs and documentation to Trip terminology and compatibility redirects.
- [x] 3.2 Run strict OpenSpec validation, `npm run tsc`, and targeted ESLint.
- [x] 3.3 Local `npm run build` passed; user manually verified canonical routes, legacy redirects, admin access, and trip detail media/notes.

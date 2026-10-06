# Tasks

## 1. Ordered trip-track data

- [x] 1.1 Add a server-side ordered association projection that reads only current successful stored GPX recording starts, orders dated tracks ascending, and preserves reverse `assignedAt` fallback for undated tracks; verify no raw GPX read or Prisma schema change is introduced.
- [x] 1.2 Apply the ordered projection to the published trip detail data while retaining published-only visibility, parsed summaries, map inputs, and recording-timezone display; verify dated and undated linked-track card scenarios from the delta spec.

## 2. Administrator trip management

- [x] 2.1 Update the administrator **Manage tracks** dialog to render its attached tracks from the ordered trip associations while retaining the existing all-track candidate list and attach/detach actions; verify administrators see the same dated/undated order as the public trip surface.
- [x] 2.2 Show each attached track's stored recording start/finish range and recording-timezone label when successful parsed time metadata exists; verify undated tracks display no invented date.

## 3. Validation and workflow records

- [x] 3.1 Run `npm run tsc` and targeted ESLint for every changed file; verify both exit successfully.
- [x] 3.4 Keep `openspec/backlog.md` and the feature task checklist current through implementation; verify the candidate is tracked as `In Progress` until the change is completed.

# Features merged to master — October 2026

Feature-numbered pull requests merged into `master` between 2026-10-01 and 2026-10-31, in merge order. Fixes, refactors, research changes, and the 2026-11-01 `feature-126` merge are not included.

| Merged | Feature | Description |
| --- | --- | --- |
| 2026-10-02 | `feature-092-trust-quotas-and-auto-promotion` | Enforced live-resource quotas for verified accounts and automatic promotion to trusted after enough received photo likes. |
| 2026-10-03 | `feature-093-admin-users-table` | Added a read-only admin users directory with email search, roles, trust levels, and linked sign-in methods. |
| 2026-10-03 | `feature-101-outdoor-track-activity-types` | Added administrator-managed track activity types with owner-selected optional classification. |
| 2026-10-04 | `feature-102-admin-photos-preview-images` | Switched admin trip-photo previews from provider originals to app-owned thumbnails. |
| 2026-10-05 | `feature-100-public-project-guide-pages` | Added a public project guide at `/about` and an account-level overview. |
| 2026-10-06 | `feature-103-admin-post-regenerate-slug` | Added an explicit **Regenerate slug** control to the admin post form. |
| 2026-10-07 | `feature-104-outdoor-trip-linked-track-recording-order` | Ordered trip-linked tracks by their recording start instead of association order. |
| 2026-10-07 | `feature-105-outdoor-trip-linked-photo-capture-order` | Defaulted trip photo galleries to capture-time order while keeping manual order as an option. |
| 2026-10-08 | `feature-107-outdoor-public-trip-add-button` | Added a capability-gated **Add Trip** button to the public `/trips` page. |
| 2026-10-09 | `feature-108-outdoor-photo-timezone-confirmation` | Added explicit photo capture-timezone confirmation and a single-track timezone fallback. |
| 2026-10-11 | `feature-110-outdoor-hike-owner-track-upload` | Let trip creators attach an owned track or upload a GPX directly from the trip page. |
| 2026-10-12 | `feature-106-outdoor-trip-day-filter` | Made the trip day selector filter the map, linked-track cards, photo gallery, and lightbox together. |
| 2026-10-13 | `feature-111-outdoor-track-creation-public` | Added public track creation from points placed on a map. |
| 2026-10-14 | `feature-112-outdoor-track-creation-public-metadata` | Added activity type and recording metadata to manually created tracks. |
| 2026-10-15 | `feature-114-outdoor-track-map-point-drag-delete` | Added drag-to-move and click-to-delete for points placed on the track map. |
| 2026-10-16 | `feature-115-outdoor-trip-owner-draft-track-visibility` | Let trip owners and administrators see the owner's draft tracks on the public trip page. |
| 2026-10-17 | `feature-113-outdoor-track-recording-metadata-display` | Displayed time source and recording start/duration on public and admin track surfaces. |
| 2026-10-18 | `feature-116-outdoor-track-recording-metadata-roundtrip` | Round-tripped recording metadata between GPX parsing and the admin edit form. |
| 2026-10-19 | `feature-117-outdoor-tracks-admin-panel-split` | Split the large tracks admin panel into smaller focused modules (internal refactor). |
| 2026-10-20 | `feature-118-admin-database-backup-generation` | Added administrator-generated PostgreSQL database backups with a downloadable archive. |
| 2026-10-23 | `feature-119-admin-sortable-header-direction-aware-icon` | Made sortable headers show the real sort direction instead of one static glyph. |
| 2026-10-24 | `feature-120-track-workout-kind` | Introduced track kind (route vs workout) and the **My Workouts** page. |
| 2026-10-25 | `feature-121-gear-personal-inventory` | Added a private owner gear inventory with activity-type links. |
| 2026-10-26 | `feature-122-outdoor-track-gear-assignment` | Allowed attaching one gear item to a track. |
| 2026-10-27 | `feature-123-outdoor-quick-workout-upload` | Added one-click quick workout upload on **My Workouts**. |
| 2026-10-27 | `feature-124-outdoor-gear-preferred-per-activity` | Added one preferred gear record per activity type, preselected in the quick upload. |
| 2026-10-28 | `feature-125-outdoor-quick-upload-published-by-default` | Made quick-upload workouts published by default. |

## Purpose

Provides the public `/comments` page as a read-only, newest-first, paginated feed of comments across every supported visible target on the site, plus an authenticated `Mine` view that filters the same feed to the viewer's own comments. It is the first consumer of the normalized shared comment list item contract and does not introduce new comment creation, mutation, moderation, or target domains.

## Requirements

### Requirement: Public unified comments feed page

The system SHALL render the public `/comments` page as a unified feed of comments across every supported visible target, listing each comment's content, author display name, author avatar when available, and created date. The page SHALL only show comments whose target is visible to the current viewer, and SHALL enforce that visibility server-side.

#### Scenario: Anonymous visitor sees video and trip-photo comments only

- **WHEN** an anonymous visitor opens `/comments`
- **THEN** the page lists comments whose target is either a video with public visibility or a photo linked to a published trip
- **AND** does not list comments whose target is hidden, unpublished, or on a target the visitor cannot view

#### Scenario: Each card links to the underlying target

- **WHEN** any comment is rendered on `/comments`
- **THEN** the card exposes the target's normalized `type`, `title`, and `href`
- **AND** a clickable source link visible on the card navigates to that `href`
- **AND** the source link is the only interactive navigation on the card so accessibility is preserved

### Requirement: Newest-first feed ordering

The system SHALL order the unified feed by `createdAt` descending so the most recent visible comment appears first.

#### Scenario: Most recent visible comment is rendered first

- **WHEN** the unified feed renders with at least two visible comments
- **THEN** the first card has a `createdAt` greater than or equal to the second card's `createdAt`

### Requirement: Paginated feed with `?page=` query parameter

The system SHALL paginate the unified feed using a `?page=N` query parameter, where page `1` is the default, page sizes are consistent across pages, and the page renders the existing shared `Pagination` control for navigation between pages.

#### Scenario: Default request shows the first page

- **WHEN** a visitor opens `/comments` with no query parameter
- **THEN** the page renders page `1` of the unified feed
- **AND** the `Pagination` control is disabled at the lower bound

#### Scenario: Explicit page request

- **WHEN** a visitor opens `/comments?page=3`
- **THEN** the page renders page `3` of the unified feed
- **AND** the `Pagination` control enables both `Previous` and `Next` when other pages exist

#### Scenario: Out-of-range page renders an empty feed

- **WHEN** a visitor opens `/comments?page=` whose value is greater than the total number of pages
- **THEN** the page renders the empty state with no comment cards
- **AND** the `Pagination` control is disabled at the upper bound

### Requirement: Authenticated `Mine` view

The system SHALL provide an authenticated `Mine` view on `/comments` that filters the unified feed to comments authored by the current viewer, controlled by a `?view=mine` query parameter. The default view for any visitor SHALL be `all`.

#### Scenario: Authenticated viewer with view=mine sees only own comments

- **WHEN** an authenticated viewer opens `/comments?view=mine`
- **THEN** every rendered card has the current viewer as its author
- **AND** no comments by other users are rendered

#### Scenario: Authenticated viewer without view parameter sees all visible comments

- **WHEN** an authenticated viewer opens `/comments`
- **THEN** the page behaves as in the default case and renders the unified feed

#### Scenario: Anonymous visitor with view=mine sees the same content as the default view

- **WHEN** an anonymous visitor opens `/comments?view=mine`
- **THEN** the page renders the same unified feed as the default view
- **AND** does not require sign-in or expose any per-user information

### Requirement: Empty state for the feed and the Mine view

The system SHALL render a clear empty state on `/comments` when the unified feed has no items, and a separate empty state on `/comments?view=mine` when the authenticated viewer has no comments. Empty states SHALL NOT render the `Pagination` control.

#### Scenario: No visible comments anywhere

- **WHEN** a visitor opens `/comments` and no supported visible target has any comments
- **THEN** the page renders the unified-feed empty state
- **AND** does not render the `Pagination` control

#### Scenario: Authenticated viewer has no comments

- **WHEN** an authenticated viewer opens `/comments?view=mine` and has no comments on any supported visible target
- **THEN** the page renders the `Mine` empty state
- **AND** does not render the `Pagination` control

### Requirement: Read-only feed without creation or mutation controls

The system SHALL NOT render any comment creation, edit, delete, moderation, reply, or report controls on `/comments`. Creation, mutation, and moderation remain exclusively on the per-target public surfaces (e.g. video detail, trip photo viewer).

#### Scenario: Feed page has no composer or action buttons

- **WHEN** any visitor opens `/comments` (with or without `?view=`)
- **THEN** the page renders no input field for new comments
- **AND** renders no edit, delete, reply, or moderation controls on any card
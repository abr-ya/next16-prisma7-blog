# Spec Delta

## MODIFIED Requirements

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

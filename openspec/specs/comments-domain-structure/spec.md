## Purpose

Define the project-wide comment domain structure before comments expand beyond videos.

## Requirements

### Requirement: Shared comment target model

The system SHALL define a project-wide comment target model before comments expand beyond videos.

#### Scenario: Comment belongs to one target

- **WHEN** the shared comment structure is planned
- **THEN** each comment SHALL belong to exactly one supported target
- **AND** the plan SHALL prefer explicit target relations such as `videoId`, `postId`, and future `mdDocId`

#### Scenario: Polymorphic target is rejected for first foundation

- **WHEN** the shared comment structure is planned
- **THEN** the first implementation plan SHALL NOT use a polymorphic `targetType` and `targetId` pair as the primary relation strategy

#### Scenario: Future docs target is deferred

- **WHEN** comment targets are planned
- **THEN** video and post targets SHALL be included in the near-term model
- **AND** markdown document comments SHALL be treated as a future target unless a later feature promotes them

### Requirement: Unified comments feed

The system SHALL define `/comments` as a unified comments feed across comment targets.

#### Scenario: Comments page is unified feed

- **WHEN** the `/comments` page is planned
- **THEN** it SHALL be defined as a feed of recent comments across accessible target content
- **AND** it SHALL NOT be defined as a standalone guestbook or site-message page

#### Scenario: All view lists public target comments

- **WHEN** a visitor opens the future `/comments` `All` view
- **THEN** the feed SHALL list recent comments only for targets visible to that visitor

#### Scenario: Mine view lists current user's comments

- **WHEN** an authenticated user opens the future `/comments` `Mine` view
- **THEN** the feed SHALL list comments authored by that user

#### Scenario: Anonymous mine view requires sign in

- **WHEN** an anonymous visitor attempts to use the future `/comments` `Mine` view
- **THEN** the page SHALL require sign-in or show an authenticated-only state

#### Scenario: Feed item links to target

- **WHEN** a comment appears in the unified comments feed
- **THEN** the item SHALL provide a link to the comment's target page

### Requirement: Reusable comment UI contract

The system SHALL define a normalized comment list item contract for future shared comment UI.

#### Scenario: Comment list item has comment fields

- **WHEN** a shared comment list item is planned
- **THEN** it SHALL include the comment id, content, and creation timestamp

#### Scenario: Comment list item has author fields

- **WHEN** a shared comment list item is planned
- **THEN** it SHALL include enough author data to show a display name and avatar or fallback avatar state

#### Scenario: Comment list item has target fields

- **WHEN** a shared comment list item is planned
- **THEN** it SHALL include the target type, target title, target href, and optional target preview

#### Scenario: Target adapters normalize data

- **WHEN** video, post, or future document comments are queried
- **THEN** target-specific helpers SHALL normalize raw records into the shared comment list item contract

### Requirement: Comment ownership and moderation boundaries

The system SHALL define ownership and moderation boundaries for project-wide comments.

#### Scenario: Ordinary user owns own comments

- **WHEN** an authenticated user creates a comment
- **THEN** the comment SHALL be owned by that user
- **AND** ordinary user edit/delete behavior SHALL stay scoped to that user's own comments

#### Scenario: Admin can moderate across targets

- **WHEN** future moderation features are planned
- **THEN** users with the `admin` role SHALL be able to moderate comments across supported targets

#### Scenario: Editor moderation is deferred

- **WHEN** future content moderation roles are planned
- **THEN** the `editor` role MAY moderate content comments later
- **AND** `editor` behavior SHALL remain deferred until a dedicated feature implements it

### Requirement: Comment follow-up slicing

The system SHALL split project-wide comment expansion into small follow-up features.

#### Scenario: Schema foundation is separate

- **WHEN** this planning slice is complete
- **THEN** schema and helper implementation SHALL be handled by a follow-up feature

#### Scenario: Feed implementation is separate

- **WHEN** this planning slice is complete
- **THEN** `/comments` unified feed implementation SHALL be handled by a follow-up feature

#### Scenario: UI extraction is separate

- **WHEN** this planning slice is complete
- **THEN** reusable comment UI extraction SHALL be handled by a follow-up feature after the shared contract is defined

#### Scenario: Existing comment follow-ups are linked

- **WHEN** this planning slice is complete
- **THEN** link handling, own edit/delete controls, expiry rules, and moderation SHALL remain separate follow-up features

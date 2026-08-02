## ADDED Requirements

### Requirement: Plain comment URL recognition

The system SHALL define a narrow plain-URL recognition policy for project comments.

#### Scenario: Plain web URLs are supported

- **WHEN** comment link handling is implemented
- **THEN** comment text containing `https://`, `http://`, or `www.` web URLs SHALL be eligible for clickable link rendering
- **AND** the stored comment content SHALL remain plain text

#### Scenario: WWW links normalize to HTTPS href

- **WHEN** comment text contains a `www.` web URL without an explicit scheme
- **THEN** the rendered link href SHALL normalize the URL to `https://`
- **AND** the visible link text SHALL preserve the original comment text

#### Scenario: Unsupported schemes remain text

- **WHEN** comment text contains an unsupported scheme such as `javascript:`, `data:`, `mailto:`, `tel:`, or a relative URL
- **THEN** that candidate SHALL remain plain text
- **AND** the system SHALL NOT reject the whole comment only because an unsupported link candidate is present

### Requirement: Safe comment link rendering

The system SHALL render comment links safely when plain URLs become clickable.

#### Scenario: Comment links render as anchors

- **WHEN** a supported plain URL appears in rendered comment text
- **THEN** the URL SHALL render as an inline anchor in the comment text flow
- **AND** ordinary non-link text SHALL continue to render as escaped text

#### Scenario: Comment links use user-generated external attributes

- **WHEN** a supported plain URL renders as an anchor
- **THEN** the anchor SHALL use `target="_blank"`
- **AND** the anchor SHALL use `rel="nofollow ugc noopener noreferrer"`

#### Scenario: Unsafe HTML is not used

- **WHEN** comment text is rendered with link handling
- **THEN** the system SHALL NOT render user comment content through `dangerouslySetInnerHTML`
- **AND** the system SHALL NOT persist sanitized HTML for comment link rendering

#### Scenario: Long links preserve layout

- **WHEN** a rendered comment contains a long URL
- **THEN** the link display SHALL wrap or otherwise stay within the comment container
- **AND** the comment list layout SHALL remain usable on mobile and desktop widths

### Requirement: Reusable comment text segmentation

The system SHALL define reusable comment text segmentation before applying link handling across comment targets.

#### Scenario: Segmentation preserves text order

- **WHEN** comment text contains plain text and supported URLs
- **THEN** the segmentation helper SHALL return ordered text and link segments matching the original comment order

#### Scenario: Parser handles trailing punctuation

- **WHEN** a supported URL is followed by ordinary sentence punctuation
- **THEN** the punctuation SHALL remain outside the link href when practical
- **AND** the punctuation SHALL remain visible as text

#### Scenario: Future comment targets reuse the policy

- **WHEN** post comments or unified comment feed items later render comment text
- **THEN** they SHALL reuse the same link recognition and safe rendering policy
- **AND** they SHALL NOT define a separate URL parsing policy unless a later feature supersedes this structure

### Requirement: Comment link feature slicing

The system SHALL keep comment link handling separate from broader comment expansion features.

#### Scenario: Structure slice has no runtime behavior change

- **WHEN** this structure slice is proposed
- **THEN** it SHALL NOT change Prisma schema, migrations, comment mutations, routes, or current comment rendering behavior

#### Scenario: First implementation target is video comments

- **WHEN** comment link handling is implemented
- **THEN** the first runtime target SHALL be existing public video comment list rendering
- **AND** post comments, `/comments` feed rendering, previews, moderation, and rich text SHALL remain separate follow-up work

## ADDED Requirements

### Requirement: Admin video channel filtering

The admin video list SHALL allow authenticated admins to filter their owned videos by channel.

#### Scenario: Admin filters videos by channel

- **WHEN** an authenticated admin opens `/admin/videos`
- **AND** the owned video list contains videos assigned to channels
- **THEN** the system SHALL show a channel filter control with an all-channels state
- **AND** the channel options SHALL be ordered by channel name ascending

#### Scenario: Admin selects a channel filter

- **WHEN** an admin selects a channel in the admin video list filter
- **THEN** the table SHALL show only loaded owned videos assigned to that channel
- **AND** the table count SHALL reflect the filtered rows
- **AND** existing table sorting, pagination, and row actions SHALL continue to operate on the filtered rows

#### Scenario: Admin clears a channel filter

- **WHEN** an admin returns the channel filter to the all-channels state
- **THEN** the table SHALL show the loaded owned videos without a channel restriction

## MODIFIED Requirements

### Requirement: Public video list

The public video list SHALL provide read-only browsing for public videos with URL-driven sort, pagination, and channel filter state.

#### Scenario: Visitor opens the public video list

- **WHEN** a visitor opens `/videos`
- **THEN** the system SHALL query only videos with `PUBLIC` visibility
- **AND** the system SHALL include each video's channel data when present
- **AND** the system SHALL default sorting to `videoDate` descending
- **AND** the system SHALL use URL query parameters for supported browse state

#### Scenario: Visitor changes public sort

- **WHEN** a visitor opens `/videos?sort=createdAt-desc`
- **THEN** the system SHALL sort public videos by newest `createdAt` first

- **WHEN** a visitor opens `/videos?sort=title-asc`
- **THEN** the system SHALL sort public videos by title ascending

#### Scenario: Visitor requests an invalid public sort

- **WHEN** a visitor opens `/videos` with an unsupported `sort` query value
- **THEN** the system SHALL use the default public video sort

#### Scenario: Visitor filters public videos by channel

- **WHEN** a visitor opens `/videos?channel={channelId}` for a public channel that has public videos
- **THEN** the system SHALL query only videos with `PUBLIC` visibility assigned to that channel
- **AND** the system SHALL show the active channel filter in the browse controls
- **AND** the channel filter SHALL NOT expose private videos

#### Scenario: Visitor requests an invalid public channel filter

- **WHEN** a visitor opens `/videos` with a missing, hidden, or unsupported `channel` query value
- **THEN** the system SHALL ignore the unsupported channel filter
- **AND** the system SHALL continue to show public videos using the remaining supported browse state

#### Scenario: Visitor pages through public videos

- **WHEN** a visitor opens `/videos?page={page}`
- **THEN** the system SHALL return a bounded page of public videos
- **AND** the default page size SHALL be 12 videos
- **AND** the system SHALL expose pagination metadata including current page, page count, page size, and total count
- **AND** pagination links SHALL preserve active supported sort and channel filter state

#### Scenario: Visitor shares a public browse URL

- **WHEN** a visitor opens a public video browse URL with supported `page`, `sort`, and `channel` query parameters
- **THEN** the system SHALL render the corresponding shareable browse state

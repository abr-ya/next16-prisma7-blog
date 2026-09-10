## Purpose

Defines a clear, enforceable access policy for the authenticated personal workspace and administrator controls so routes, navigation, and server actions present the same permissions.

## ADDED Requirements

### Requirement: Active roles and scoped capabilities are documented
The system SHALL maintain an access matrix that defines the active `user` and `admin` roles, plus owner-scoped and accepted-trip-participant capabilities. The matrix SHALL cover each audited workspace route and action, state its server-side authorization rule, and distinguish personal ownership from administrator override.

#### Scenario: Maintainer reviews a workspace capability
- **WHEN** a maintainer needs to determine whether a user can access a workspace route or action
- **THEN** the access matrix identifies the allowed actor, resource scope, and denial behavior
- **AND** it does not rely on sidebar visibility as the authorization source

#### Scenario: Future role is considered
- **WHEN** a future role such as `editor` is proposed
- **THEN** the matrix records it as unimplemented until a dedicated feature defines and enforces its capabilities
- **AND** the active `user` and `admin` policy remains unchanged

### Requirement: Personal workspace is distinct from administrator controls
The system SHALL expose owner-scoped workspace destinations separately from administrator-only control destinations within the authenticated `/admin` shell. A signed-in `user` SHALL be able to access and manage only their own posts, tracks, and trips through the personal workspace; an `admin` SHALL retain access to the administrator controls defined in the matrix.

#### Scenario: Ordinary user opens workspace
- **WHEN** a signed-in `user` opens `/admin`
- **THEN** the navigation presents their personal workspace destinations
- **AND** it does not present administrator-only controls as available actions

#### Scenario: Administrator opens workspace
- **WHEN** a signed-in `admin` opens `/admin`
- **THEN** the navigation presents both personal workspace destinations and a visually distinct administrator control section

#### Scenario: Ordinary user requests an administrator-only route
- **WHEN** a signed-in `user` requests an administrator-only route directly
- **THEN** the system denies access before rendering protected records, configuration, or controls
- **AND** it provides a safe redirect or forbidden response consistent with the application route convention

### Requirement: Server actions enforce ownership and administrator override
The system SHALL enforce the access matrix independently of UI visibility for audited workspace mutations. A `user` MAY create owner-scoped posts, tracks, and trips and MAY read, update, or delete only records they own. An `admin` MAY perform the explicitly listed cross-user, media-association, file-lifecycle, map-review, and global-control actions. Accepted trip participation SHALL grant only the separately defined trip contribution capabilities.

#### Scenario: User updates own content
- **WHEN** a signed-in `user` submits an update for a post, track, or trip they own
- **THEN** the system permits the update according to that content type's normal validation

#### Scenario: User attempts another user's content mutation
- **WHEN** a signed-in `user` submits a read, update, delete, or association mutation targeting content owned by another user
- **THEN** the system denies the request
- **AND** it does not disclose protected content or change its ownership

#### Scenario: User attempts administrator-only media or file control
- **WHEN** a signed-in `user` directly invokes an audited administrator-only photo, file, map-review, or global-control action
- **THEN** the system denies the request
- **AND** it does not change the protected resource

#### Scenario: Accepted participant uses trip contribution
- **WHEN** an accepted trip participant uses an explicitly supported public trip contribution workflow
- **THEN** the system grants only that trip-scoped contribution capability
- **AND** it does not grant personal-workspace access to the trip owner's records or administrator controls

### Requirement: Route and action policy is verified together
The system SHALL validate the access matrix with representative route and direct-action checks for anonymous visitor, ordinary user, resource owner, accepted participant, and administrator contexts.

#### Scenario: UI and action policy agree
- **WHEN** a role is denied a workspace control in the UI
- **THEN** direct invocation of the corresponding server action is also denied
- **AND** a permitted UI control remains usable for its authorized actor

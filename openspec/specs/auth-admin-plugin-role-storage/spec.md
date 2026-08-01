## Purpose

Define the Better Auth Admin plugin role-storage foundation for persisted user roles, safe defaults, manual first-admin promotion, and minimal role helper validation.
## Requirements
### Requirement: Better Auth Admin plugin integration

The system SHALL integrate Better Auth Admin plugin as the first auth-owned role-management foundation.

#### Scenario: Server auth config includes admin plugin

- **WHEN** the auth server configuration is loaded
- **THEN** Better Auth SHALL be configured with the Admin plugin
- **AND** the existing cookie integration SHALL continue to work

#### Scenario: Admin client plugin is available

- **WHEN** client-side auth helpers need typed admin plugin support
- **THEN** the auth client SHALL include the matching Better Auth admin client plugin

#### Scenario: Unsupported admin UI is not introduced

- **WHEN** this role-storage slice is implemented
- **THEN** the app SHALL NOT add UI for user creation, banning, impersonation, user deletion, password setting, email setting, or broad user management

### Requirement: Persisted role storage

The system SHALL store first-party roles and required Admin plugin fields on the existing Prisma auth models using Better Auth-compatible field shapes.

#### Scenario: User model has role field

- **WHEN** the Prisma schema is updated for role storage
- **THEN** the `User` model SHALL include a persisted role field compatible with Better Auth Admin plugin conventions

#### Scenario: Admin plugin fields are persisted

- **WHEN** the Prisma schema is updated for Admin plugin compatibility
- **THEN** the `User` model SHALL include the Admin plugin user fields required by the installed Better Auth version
- **AND** the `Session` model SHALL include the Admin plugin session fields required by the installed Better Auth version

#### Scenario: Existing users default safely

- **WHEN** the role-storage migration is applied
- **THEN** existing users SHALL receive the ordinary `user` role by default
- **AND** no existing user SHALL be promoted to `admin` automatically

#### Scenario: New users default safely

- **WHEN** a new user is created through email/password, GitHub, Google, or another public registration path
- **THEN** the user SHALL receive the ordinary `user` role by default
- **AND** the auth provider SHALL NOT imply elevated access

#### Scenario: Editor is not active

- **WHEN** role storage is implemented
- **THEN** `editor` MAY be documented as a future role
- **AND** the first role checks SHALL only require active `user` and `admin` behavior

### Requirement: Manual first-admin promotion

The system SHALL support explicit manual promotion for the first administrator.

#### Scenario: First admin promotion is documented

- **WHEN** role storage is ready for rollout
- **THEN** the implementation notes or closeout SHALL document how to promote the first `admin` with Prisma Studio or SQL

#### Scenario: Automatic bootstrap is absent

- **WHEN** users register after role storage exists
- **THEN** the system SHALL NOT automatically promote the first registered user
- **AND** the system SHALL NOT require an `INITIAL_ADMIN_EMAIL` bootstrap variable in this slice

### Requirement: Minimal server-side role helpers

The system SHALL provide minimal server-only helpers for future role-gated operations.

#### Scenario: Authenticated user role can be read

- **WHEN** server code needs the current authenticated user's role
- **THEN** it SHALL be able to read the role from the persisted user record or Better Auth session data

#### Scenario: Admin access can be required

- **WHEN** future sensitive server pages or actions need administrator access
- **THEN** a reusable helper SHALL be available to require the `admin` role

#### Scenario: Admin shell remains session-gated

- **WHEN** role helpers are introduced
- **THEN** the app SHALL keep creator-owned `/admin` layout access gated by authenticated session presence
- **AND** it SHALL NOT replace the entire `/admin` layout boundary with an administrator-only check

### Requirement: Role-storage validation

The system SHALL validate the role-storage slice against schema, type, route, and auth expectations.

#### Scenario: Prisma client is regenerated

- **WHEN** the Prisma schema changes
- **THEN** the generated Prisma client SHALL be regenerated through the project flow
- **AND** generated client files SHALL NOT be edited manually

#### Scenario: Static validation passes

- **WHEN** role-storage implementation is complete
- **THEN** TypeScript validation SHALL pass
- **AND** lint validation SHALL pass for changed application files

#### Scenario: Build validation is requested

- **WHEN** role-storage implementation is complete
- **THEN** a production build SHALL be run locally or explicitly handed off for local validation

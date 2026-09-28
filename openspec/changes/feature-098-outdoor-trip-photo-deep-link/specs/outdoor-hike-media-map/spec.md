# Spec Delta

## MODIFIED Requirements

### Requirement: Public hike pages show linked published photos

The system SHALL show associated published photos on published hike detail pages while preserving separate guest thumbnail access, authenticated full-photo access, existing photo visibility, image file, and metadata boundaries. The authenticated large-photo viewer SHALL visibly distinguish a selected image that is loading or has failed from an already loaded image, and SHALL NOT leave a previous selection presented as the newly selected photo. A published trip URL MAY identify one linked photo through its `photo` query parameter, and the viewer SHALL synchronize that valid selected photo with the URL without weakening full-photo access rules.

#### Scenario: Visitor opens hike with linked published photos

- **WHEN** an anonymous visitor opens `/hikes/[slug]` for a published hike that has associated published photos
- **THEN** the page shows the linked photo set within the hike detail experience using true thumbnail-sized image responses only
- **AND** the photos render in the hike-specific stored order
- **AND** the page SHALL NOT expose full-size photo image bytes, provider URLs, or large-photo viewer controls to the anonymous visitor

#### Scenario: Signed-in user opens hike with linked published photos

- **WHEN** an authenticated site user opens `/hikes/[slug]` for a published hike that has associated published photos
- **THEN** the page shows the linked photo set within the hike detail experience
- **AND** the user can open a large-photo viewer for those photos
- **AND** the viewer renders linked photos in the hike-specific stored order
- **AND** the viewer identifies the active photo's ordinal and the total number of linked photos

#### Scenario: Viewer loads the first selected full-size photo

- **WHEN** an authenticated user opens the large-photo viewer
- **THEN** the viewer shows a visible loading state until the selected full-size image finishes loading or fails
- **AND** it does not display a stale image in place of the selected photo

#### Scenario: Viewer changes photo while the next image loads

- **WHEN** an authenticated user selects previous or next while the large-photo viewer is open
- **THEN** the viewer immediately identifies the new selection and shows a visible loading state until that selected image finishes loading or fails
- **AND** it does not present the previously selected image as the newly selected photo
- **AND** previous and next controls remain usable during the load

#### Scenario: Selected full-size photo fails to load

- **WHEN** the selected full-size image reports a load failure
- **THEN** the viewer replaces the loading state with an understandable error state for that selection
- **AND** it keeps available navigation controls usable
- **AND** it does not expose a provider URL or internal storage error

#### Scenario: Signed-in visitor opens a valid photo deep link

- **WHEN** an authenticated visitor opens `/trips/[slug]?photo={photoId}` for a photo linked to that published trip and eligible for the existing viewer
- **THEN** the page opens the existing viewer with that photo selected
- **AND** the viewer retains its current loading, navigation, details, comments, and access behavior

#### Scenario: Viewer navigation updates a valid photo deep link

- **WHEN** an authenticated visitor changes the selected photo in the viewer or closes the viewer
- **THEN** the current trip URL updates without a full page navigation or scroll reset
- **AND** it identifies the active linked photo while the viewer is open
- **AND** it removes the `photo` parameter when the viewer closes

#### Scenario: Photo deep link is invalid for the current trip

- **WHEN** a visitor opens a published trip URL whose `photo` parameter is missing, malformed, not linked to that trip, unavailable, or otherwise ineligible for the viewer
- **THEN** the page remains on the published trip in its normal state
- **AND** it does not open a viewer, redirect to another trip, or expose photo metadata or protected image access

#### Scenario: Guest opens a valid photo deep link

- **WHEN** an anonymous visitor opens a valid published trip photo deep link
- **THEN** the page follows the existing sign-in guidance for the selected photo
- **AND** it does not expose a full-size image URL, bytes, provider URL, or protected photo details

#### Scenario: Visitor opens hike with no public linked photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no associated published photos
- **THEN** the page remains usable with the hike's own title, description, date range, type, and any other public media
- **AND** it does not show broken linked-photo controls

#### Scenario: Linked photo image is not public-display eligible

- **WHEN** a published hike has an associated published photo whose image file asset is private, inactive, missing, or otherwise not public-display eligible
- **THEN** the public hike page does not expose that image file or provider URL
- **AND** the page degrades gracefully around the unavailable linked photo image

#### Scenario: Linked photo has extracted metadata

- **WHEN** a published hike has an associated published photo with stored EXIF, GPS, camera, or extraction error metadata
- **THEN** the public hike page SHALL NOT expose new public photo EXIF, GPS, camera, or extraction error details from this slice
- **AND** it may still display basic visibility-safe title or description fields

#### Scenario: Guest attempts to access full photo directly

- **WHEN** an anonymous visitor requests a full-size linked hike photo image directly
- **THEN** the system rejects the request with an authentication-required response
- **AND** it does not return the full-size image bytes

# Spec Delta

## ADDED Requirements

### Requirement: Admin trip photo association separates photos already held by other trips

The system SHALL, in the administrator's trip photo-association surface, present the photos available for attachment to a trip without, by default, listing the photos that are already associated with another trip. The system SHALL keep those photos attachable to that trip and SHALL provide the administrator with a control that reveals them. The photos already associated with the trip being managed, their stored order, and every attach, detach, and reorder action SHALL remain unchanged.

#### Scenario: Admin opens the photo-association surface for a trip

- **WHEN** an authenticated admin opens the photo-association surface for a trip
- **THEN** the photos available for attachment do not include the photos that are already associated with another trip
- **AND** the photos associated with that trip are listed as attached, in their stored order

#### Scenario: Admin reveals the photos held by other trips

- **WHEN** the photos available for attachment to a trip include photos that are associated with another trip
- **THEN** the surface shows a control that reveals those photos
- **AND** the control reports how many photos it holds back
- **AND** the surface shows no such control when no photo is held back

#### Scenario: Admin attaches a revealed photo

- **WHEN** an authenticated admin reveals the photos held by other trips and attaches one of them to the trip
- **THEN** that photo is associated with the trip as well
- **AND** its association with the other trip, and that trip's stored order for it, are preserved

#### Scenario: Admin attaches a photo that is held by no other trip

- **WHEN** an authenticated admin attaches a photo that is not associated with any other trip
- **THEN** that photo is associated with the trip
- **AND** the attach action and the resulting list are unchanged from the behavior before this requirement

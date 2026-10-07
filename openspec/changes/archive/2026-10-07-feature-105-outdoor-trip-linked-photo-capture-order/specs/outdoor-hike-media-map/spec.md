# Spec Delta

## ADDED Requirements

### Requirement: Published trip photos support chronological and manual ordering

The system SHALL default a published trip photo gallery and its authenticated full-photo viewer navigation to ascending reliable stored capture instant. It SHALL provide an always-visible localized selector for `Capture time` and `Manual order`. Chronological mode SHALL place photos without a reliable stored capture instant after dated photos while preserving their manual association order; manual mode SHALL preserve the existing photo association order. The selector SHALL be disabled when both modes produce the same sequence.

#### Scenario: Visitor opens a trip with dated and undated photos

- **WHEN** a visitor opens a published trip with linked published photos that have reliable stored capture instants and photos without one
- **THEN** `Capture time` is selected by default
- **AND** dated photos appear in ascending capture-instant order
- **AND** undated photos appear after all dated photos in their manual association order

#### Scenario: Visitor selects manual order

- **WHEN** a visitor selects `Manual order` for a published trip photo gallery
- **THEN** the gallery renders linked photos in their existing manual association order
- **AND** the authenticated full-photo viewer previous/next navigation follows that same manual sequence

#### Scenario: Ordering modes cannot change the sequence

- **WHEN** a trip has fewer than two linked photos or its chronological and manual sequences are identical
- **THEN** the ordering selector remains visible but disabled
- **AND** localized helper text explains that the selected ordering is already applied

#### Scenario: Photo ordering is represented without navigation

- **WHEN** a visitor changes the photo ordering mode or selects a photo in the full-photo viewer
- **THEN** the URL reflects the current `photoOrder` and `photo` parameters together
- **AND** the update replaces the current history entry rather than adding a photo-or-order entry
- **AND** the change does not trigger route navigation or weaken existing photo-access boundaries

### Requirement: Undated trip photos are visibly identified

The system SHALL show an accessible red information indicator before the title of every linked published photo without a reliable stored capture instant, regardless of the active ordering mode. The indicator SHALL provide localized EN/RU tooltip and accessible-label text explaining that the capture date is unavailable and that chronological ordering places the photo after dated photos.

#### Scenario: Visitor views an undated photo in chronological mode

- **WHEN** a visitor views a linked published photo without a reliable stored capture instant while `Capture time` is active
- **THEN** the card shows the red information indicator before its title
- **AND** its localized tooltip explains the unavailable date and chronological fallback

#### Scenario: Visitor views an undated photo in manual mode

- **WHEN** a visitor selects `Manual order` and views a linked published photo without a reliable stored capture instant
- **THEN** the same red information indicator remains visible before that photo's title
- **AND** the manual ordering choice does not hide the unavailable-date feedback
